"""Object storage client for persisting raw pipeline artifacts."""

from __future__ import annotations

import io
import json
import logging
import os
from pathlib import Path
from typing import Any, Dict

import boto3
import pandas as pd
from botocore.client import BaseClient
from botocore.config import Config as BotoConfig
from botocore.exceptions import BotoCoreError, ClientError

try:  # pragma: no cover - optional dependency
    from cloudflare import Cloudflare
except ImportError:  # pragma: no cover - dependency managed via requirements.txt
    Cloudflare = None  # type: ignore[assignment]

from bsi_nil.config import load_config

logger = logging.getLogger(__name__)


class RawStorageClient:
    """Persist raw data artifacts to the configured object storage."""

    def __init__(
        self,
        bucket_name: str | None = None,
        prefix: str | None = None,
        client: BaseClient | None = None,
    ) -> None:
        config = load_config()
        storage_config: Dict[str, Any] = config.get("storage", {})
        self.provider = str(storage_config.get("provider", "s3")).lower()

        if self.provider == "local":
            local_root = storage_config.get("local_path", "storage/raw")
            self.base_path = Path(local_root)
            self.base_path.mkdir(parents=True, exist_ok=True)
            self.prefix = ""
            self.client = None
            self.bucket = None
            return

        self.bucket = bucket_name or self._resolve_value(storage_config, "bucket")
        self.prefix = (prefix or storage_config.get("prefix", "")).lstrip("/")

        region = self._resolve_value(storage_config, "region", optional=True)
        endpoint_url = self._resolve_value(storage_config, "endpoint", optional=True)
        credentials = storage_config.get("credentials", {}) if isinstance(storage_config, dict) else {}
        access_key = self._resolve_value(credentials, "access_key", optional=True)
        secret_key = self._resolve_value(credentials, "secret_key", optional=True)
        session_token = self._resolve_value(credentials, "session_token", optional=True)

        session = boto3.session.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            aws_session_token=session_token,
            region_name=region,
        )

        signature_version = "s3v4"
        addressing_style = "path" if self.provider == "r2" else None
        boto_config = BotoConfig(signature_version=signature_version)
        if addressing_style:
            boto_config = boto_config.merge(BotoConfig(s3={"addressing_style": addressing_style}))

        self.client = client or session.client(
            "s3",
            endpoint_url=endpoint_url,
            config=boto_config,
        )

        if self.provider == "r2":
            cloudflare_config = storage_config.get("cloudflare", {})
            self._bootstrap_r2_bucket(cloudflare_config)

        self._ensure_bucket()

    def _resolve_value(
        self, config: Dict[str, Any] | None, key: str, *, optional: bool = False
    ) -> str | None:
        if not isinstance(config, dict):
            if optional:
                return None
            raise ValueError(f"Storage configuration missing for key '{key}'")

        direct_key = key
        env_key = f"{key}_env"

        if env_key in config:
            env_var = config[env_key]
            if env_var:
                value = os.getenv(str(env_var))
                if value:
                    return value

        if direct_key in config and config[direct_key] not in {None, ""}:
            return str(config[direct_key])

        if optional:
            return None

        raise ValueError(f"Storage configuration requires '{key}' or '{env_key}'")

    def _object_key(self, name: str, suffix: str) -> str:
        clean_prefix = f"{self.prefix.rstrip('/')}/" if self.prefix else ""
        return f"{clean_prefix}{name}{suffix}"

    def _bootstrap_r2_bucket(self, cloudflare_config: Dict[str, Any] | None) -> None:
        if Cloudflare is None or not isinstance(cloudflare_config, dict):
            return

        account_id = self._resolve_value(cloudflare_config, "account_id", optional=True)
        api_token = self._resolve_value(cloudflare_config, "token", optional=True)
        if not account_id or not api_token:
            return

        try:
            cf_client = Cloudflare(api_token=api_token)
            r2_resource = getattr(cf_client, "r2", None)
            buckets_resource = getattr(r2_resource, "buckets", None)
            if buckets_resource is None:
                logger.debug("Cloudflare SDK does not expose R2 buckets helper; skipping bootstrap")
                return

            existing = buckets_resource.list(account_id=account_id)
            names: set[str] = set()
            if isinstance(existing, dict):
                results = existing.get("result")
                if isinstance(results, list):
                    names = {
                        bucket.get("name")
                        for bucket in results
                        if isinstance(bucket, dict) and bucket.get("name")
                    }
            if self.bucket in names:
                return

            buckets_resource.create(account_id=account_id, body={"name": self.bucket})
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.warning("Cloudflare R2 bucket bootstrap failed: %s", exc)

    def _ensure_bucket(self) -> None:
        assert self.client is not None
        try:
            self.client.head_bucket(Bucket=self.bucket)
        except ClientError as exc:
            error_code = str(exc.response.get("Error", {}).get("Code", ""))
            if error_code in {"404", "NoSuchBucket"}:
                if self.provider == "r2":
                    raise RuntimeError(
                        f"Cloudflare R2 bucket '{self.bucket}' is missing. "
                        "Provide CLOUDFLARE credentials or create the bucket manually."
                    ) from exc
                create_kwargs: Dict[str, Any] = {"Bucket": self.bucket}
                if self.client.meta.region_name:
                    create_kwargs["CreateBucketConfiguration"] = {
                        "LocationConstraint": self.client.meta.region_name
                    }
                self.client.create_bucket(**create_kwargs)
            else:
                raise

    def save_dataframe(self, df: pd.DataFrame, name: str) -> str:
        """Write a DataFrame to CSV under the configured storage bucket."""

        if self.provider == "local":
            path = self.base_path / f"{name}.csv"
            df.to_csv(path, index=False)
            return str(path)

        key = self._object_key(name, ".csv")
        buffer = io.StringIO()
        df.to_csv(buffer, index=False)
        payload = buffer.getvalue().encode("utf-8")
        self._upload_bytes(payload, key, content_type="text/csv")
        return f"s3://{self.bucket}/{key}"

    def save_json(self, data: Dict[str, Any], name: str) -> str:
        """Write JSON payload to object storage."""

        if self.provider == "local":
            path = self.base_path / f"{name}.json"
            with path.open("w", encoding="utf-8") as fh:
                json.dump(data, fh, indent=2, default=str)
            return str(path)

        key = self._object_key(name, ".json")
        payload = json.dumps(data, indent=2, default=str).encode("utf-8")
        self._upload_bytes(payload, key, content_type="application/json")
        return f"s3://{self.bucket}/{key}"

    def _upload_bytes(self, payload: bytes, key: str, *, content_type: str) -> None:
        assert self.client is not None
        try:
            self.client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=payload,
                ContentType=content_type,
            )
        except (BotoCoreError, ClientError) as exc:
            logger.error("Failed to upload %s to %s: %s", key, self.bucket, exc)
            raise
