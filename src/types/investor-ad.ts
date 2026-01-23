export type InvestorAdProps = {
  investorAmount?: number;
  founderAmount?: number;
  marketSize2025?: number;
  marketSize2034?: number;
  cagr?: number;
  breakEvenMonth?: number;
  audioSrc?: string;
  audioVolume?: number;
};

export type SceneConfig = {
  name: string;
  durationFrames: number;
};

export const INVESTOR_AD_SCENES: SceneConfig[] = [
  { name: 'Hook', durationFrames: 240 },           // 8s
  { name: 'Origin', durationFrames: 540 },         // 18s (trimmed from 25s)
  { name: 'Problem', durationFrames: 300 },        // 10s
  { name: 'Solution', durationFrames: 360 },       // 12s
  { name: 'Tech', durationFrames: 300 },           // 10s
  { name: 'Ask', durationFrames: 360 },            // 12s (now includes CTA)
  { name: 'Covenant', durationFrames: 750 },       // 25s
];

export const INVESTOR_AD_DEFAULTS: Required<Omit<InvestorAdProps, 'audioSrc' | 'audioVolume'>> = {
  investorAmount: 20000,
  founderAmount: 0,
  marketSize2025: 1.7,
  marketSize2034: 8.6,
  cagr: 20,
  breakEvenMonth: 18,
};

export function getTotalDuration(): number {
  const sceneDuration = INVESTOR_AD_SCENES.reduce((sum, s) => sum + s.durationFrames, 0);
  const transitionFrames = 15 * (INVESTOR_AD_SCENES.length - 1);
  // TransitionSeries transitions overlap scenes, so subtract them
  return sceneDuration - transitionFrames;
}
