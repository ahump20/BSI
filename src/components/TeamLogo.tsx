import { Img } from 'remotion';
import { BSI_COLORS } from '../lib/colors';
import { fontFamily } from '../lib/fonts';

type TeamLogoProps = {
  logo: string;
  abbreviation: string;
  size?: number;
};

export function TeamLogo({
  logo,
  abbreviation,
  size = 150,
}: TeamLogoProps): React.ReactElement {
  if (!logo) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: BSI_COLORS.charcoal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: fontFamily.inter,
          fontSize: size * 0.4,
          fontWeight: 800,
          color: BSI_COLORS.burntOrange,
          border: `3px solid ${BSI_COLORS.burntOrange}`,
        }}
      >
        {abbreviation}
      </div>
    );
  }

  return (
    <Img
      src={logo}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
      }}
    />
  );
}
