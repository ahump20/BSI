import { loadFont } from '@remotion/google-fonts/Inter';

const { fontFamily: interFontFamily, waitUntilDone: interReady } = loadFont();

export const fontFamily = {
  inter: interFontFamily,
};

export async function waitForFonts(): Promise<void> {
  await interReady();
}

export { interReady };
