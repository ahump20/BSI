using UnityEngine;
using TMPro;

namespace BlazeField
{
    public enum WeightClass { Light, Medium, Heavy }

    public class PlayerModelBuilder : MonoBehaviour
    {
        [Header("Team Colors")]
        public Color teamColor = Color.white;
        public Color helmetColor = Color.white;
        public Color accentColor = Color.gray;

        [Header("Identity")]
        public int jerseyNumber = 0;
        public WeightClass weightClass = WeightClass.Medium;

        // Part references for animation
        [HideInInspector] public Transform torso;
        [HideInInspector] public Transform head;
        [HideInInspector] public Transform helmet;
        [HideInInspector] public Transform shoulderPads;
        [HideInInspector] public Transform armL;
        [HideInInspector] public Transform armR;
        [HideInInspector] public Transform legL;
        [HideInInspector] public Transform legR;

        static Material sharedOpaqueMat;

        [Header("Rendering")]
        [SerializeField] Shader playerShader;

        void Awake()
        {
            Build();
        }

        public void Build()
        {
            // Clear existing children
            for (int i = transform.childCount - 1; i >= 0; i--)
                DestroyImmediate(transform.GetChild(i).gameObject);

            if (sharedOpaqueMat == null)
            {
                if (playerShader != null)
                {
                    sharedOpaqueMat = new Material(playerShader);
                }
                else
                {
                    // Create a temp primitive to grab whatever default material Unity has loaded
                    var tmp = GameObject.CreatePrimitive(PrimitiveType.Quad);
                    sharedOpaqueMat = new Material(tmp.GetComponent<Renderer>().sharedMaterial);
                    DestroyImmediate(tmp);
                }
                sharedOpaqueMat.name = "BlazeField_SharedPlayer";
            }

            float scale = weightClass switch
            {
                WeightClass.Light => 0.9f,
                WeightClass.Heavy => 1.15f,
                _ => 1f,
            };

            Color skinColor = new Color(0.76f, 0.60f, 0.42f);
            Color pantsColor = Color.white;

            // Torso — capsule
            torso = CreatePrimitive("Torso", PrimitiveType.Capsule,
                new Vector3(0f, 1.1f, 0f),
                new Vector3(0.4f * scale, 0.35f * scale, 0.3f * scale),
                teamColor);

            // Head — sphere
            head = CreatePrimitive("Head", PrimitiveType.Sphere,
                new Vector3(0f, 1.65f, 0f),
                Vector3.one * 0.2f,
                skinColor);

            // Helmet — sphere (slightly larger)
            helmet = CreatePrimitive("Helmet", PrimitiveType.Sphere,
                new Vector3(0f, 1.68f, 0f),
                Vector3.one * 0.25f,
                helmetColor);

            // Face mask bars (3 tiny cylinders)
            for (int i = 0; i < 3; i++)
            {
                float yOff = 1.62f + i * 0.03f;
                CreatePrimitive($"Facemask_{i}", PrimitiveType.Cylinder,
                    new Vector3(0f, yOff, 0.11f),
                    new Vector3(0.12f, 0.005f, 0.005f),
                    Color.gray);
            }

            // Shoulder pads — flattened sphere
            shoulderPads = CreatePrimitive("ShoulderPads", PrimitiveType.Sphere,
                new Vector3(0f, 1.4f, 0f),
                new Vector3(0.5f * scale, 0.12f, 0.35f * scale),
                teamColor * 0.85f);

            // Arms
            armL = CreatePrimitive("ArmL", PrimitiveType.Cylinder,
                new Vector3(-0.28f * scale, 1.1f, 0f),
                new Vector3(0.08f, 0.14f, 0.08f),
                teamColor);

            armR = CreatePrimitive("ArmR", PrimitiveType.Cylinder,
                new Vector3(0.28f * scale, 1.1f, 0f),
                new Vector3(0.08f, 0.14f, 0.08f),
                teamColor);

            // Legs
            legL = CreatePrimitive("LegL", PrimitiveType.Cylinder,
                new Vector3(-0.1f * scale, 0.45f, 0f),
                new Vector3(0.1f, 0.16f, 0.1f),
                pantsColor);

            legR = CreatePrimitive("LegR", PrimitiveType.Cylinder,
                new Vector3(0.1f * scale, 0.45f, 0f),
                new Vector3(0.1f, 0.16f, 0.1f),
                pantsColor);

            // Jersey number on front of torso
            if (jerseyNumber > 0)
                CreateJerseyNumber();
        }

        Transform CreatePrimitive(string partName, PrimitiveType type, Vector3 localPos, Vector3 localScale, Color color)
        {
            var go = GameObject.CreatePrimitive(type);
            go.name = partName;
            go.transform.SetParent(transform, false);
            go.transform.localPosition = localPos;
            go.transform.localScale = localScale;

            // Remove collider — parent has the real one
            var col = go.GetComponent<Collider>();
            if (col != null) Destroy(col);

            // Use shared material + property block for color
            var rend = go.GetComponent<Renderer>();
            rend.sharedMaterial = sharedOpaqueMat;
            var mpb = new MaterialPropertyBlock();
            // _Color for Standard, _BaseColor for URP — set both so either pipeline works
            mpb.SetColor("_Color", color);
            mpb.SetColor("_BaseColor", color);
            rend.SetPropertyBlock(mpb);

            return go.transform;
        }

        void CreateJerseyNumber()
        {
            var go = new GameObject("JerseyNumber");
            go.transform.SetParent(torso, false);
            go.transform.localPosition = new Vector3(0f, 0.05f, 0.16f);
            go.transform.localRotation = Quaternion.identity;
            go.transform.localScale = Vector3.one * 3f; // scale relative to tiny torso

            var tmp = go.AddComponent<TextMeshPro>();
            tmp.text = jerseyNumber.ToString();
            tmp.fontSize = 4;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = accentColor;
            tmp.enableAutoSizing = false;

            var rt = tmp.GetComponent<RectTransform>();
            rt.sizeDelta = new Vector2(1f, 0.5f);
        }
    }
}
