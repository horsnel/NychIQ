import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function analyzeImages() {
  const zai = await ZAI.create();

  const img1Path = '/home/z/my-project/upload/Screenshot_20260410-071214 (1).png';
  const img2Path = '/home/z/my-project/upload/Screenshot_20260410-071236 (1).png';

  const img1Buffer = fs.readFileSync(img1Path);
  const img2Buffer = fs.readFileSync(img2Path);
  const img1Base64 = img1Buffer.toString('base64');
  const img2Base64 = img2Buffer.toString('base64');

  const img1DataUrl = 'data:image/png;base64,' + img1Base64;
  const img2DataUrl = 'data:image/png;base64,' + img2Base64;

  const prompt = 'You are a world-class CSS UI expert and visual designer. Analyze BOTH images in EXTREME, OBSESSIVE detail. IMAGE 1 (first image) is the ACTIVE state of a search bar - it has a glowing, swaying animation effect. IMAGE 2 (second image) is the INACTIVE state of the same search bar. I need to recreate this EXACTLY in CSS. For EACH image, please describe: 1. SHAPE: Is it pill-shaped (fully rounded ends) or rounded rectangle? 2. BORDER/GLOW EFFECT (ACTIVE state): Is it a solid border or gradient border? How many distinct colors in the glow? List each color. 3. GLOW SPREAD: How wide is the glow beyond the search bar edge? Soft blurry edge or sharp? Visible gap between bar and glow? 4. GLOW ANIMATION: The glow is described as swaying. Does the glow appear to rotate around the border? Conic-gradient that shifts? Pulse in opacity? 5. SEARCH ICON: Outlined or filled magnifying glass? Color? Position? Size? 6. PLACEHOLDER TEXT: What exact text? Color? Font weight? 7. INNER BACKGROUND: Solid? Semi-transparent? Frosted glass? Dark or light? 8. SURROUNDING AREA: What is behind the search bar? 9. COMPARISON: What exactly changes between ACTIVE and INACTIVE? Be absolutely exhaustive.';

  const content = [
    { type: 'text', text: prompt },
    { type: 'image_url', image_url: { url: img1DataUrl } },
    { type: 'image_url', image_url: { url: img2DataUrl } }
  ];

  const response = await zai.chat.completions.createVision({
    messages: [{ role: 'user', content: content }],
    thinking: { type: 'enabled' }
  });

  const result = response.choices[0]?.message?.content;
  console.log(result);
}

analyzeImages().catch(console.error);
