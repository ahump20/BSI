# The Garrido Code - Audio Integration Guide

## ✅ Audio Player Integration: COMPLETE

All 10 episode pages now have functional HTML5 audio players with the following structure:

```html
<audio controls style="width: 100%;">
    <source src="/garrido/audio/ep##-[slug].mp3" type="audio/mpeg">
    Your browser does not support the audio element.
</audio>
```

## 📁 Required Audio Files

The following MP3 files need to be generated and placed in `/Users/AustinHumphrey/BSI/garrido/audio/`:

1. `ep01-chaos.mp3` - Episode 01: Chaos Is the Only Constant (~26 min)
2. `ep02-respect.mp3` - Episode 02: Respect the Game, Not the Result (~22 min)
3. `ep03-teach.mp3` - Episode 03: Let the Game Teach the Game (~24 min)
4. `ep04-failure.mp3` - Episode 04: Failure as Information (~20 min)
5. `ep05-poetry.mp3` - Episode 05: The Poetry of Practice (~25 min)
6. `ep06-team.mp3` - Episode 06: The Team Within the Team (~23 min)
7. `ep07-architecture.mp3` - Episode 07: Practice Architecture (~21 min)
8. `ep08-flow.mp3` - Episode 08: Flow & Focus (~24 min)
9. `ep09-memory.mp3` - Episode 09: Institutional Memory (~22 min)
10. `ep10-legacy.mp3` - Episode 10: Legacy Over Victory (~26 min)

## 🎙️ Audio Generation via NotebookLM

### Method 1: NotebookLM Audio Overview (Recommended)

**NotebookLM** is Google's AI-powered research tool that can generate podcast-style audio from text content.

#### Steps:

1. **Create a NotebookLM Project**:
   - Go to https://notebooklm.google.com
   - Create a new notebook
   - Name it "The Garrido Code - Episode XX"

2. **Upload Source Material**:
   - Copy transcript content from each episode HTML file
   - OR upload the transcript as a text document
   - NotebookLM can process up to 50 sources per notebook

3. **Generate Audio Overview**:
   - Click "Generate" in the Audio Overview section
   - NotebookLM will create a ~10-20 minute conversation between two AI hosts
   - The audio is generated automatically from your source material

4. **Download MP3**:
   - Once generated, download the MP3 file
   - Rename to match the episode (e.g., `ep01-chaos.mp3`)
   - Place in `/garrido/audio/` directory

5. **Customize (Optional)**:
   - Use the "Customize" button to guide the conversation
   - Add specific topics or questions you want covered
   - Regenerate if needed

#### NotebookLM Audio Characteristics:
- Two AI hosts (male and female voices)
- Conversational podcast style
- Automatically extracts key insights
- Professional production quality
- Free to use (Google account required)

### Method 2: Text-to-Speech Alternatives

If NotebookLM doesn't meet your needs, consider these alternatives:

#### ElevenLabs (https://elevenlabs.io)
- High-quality voice cloning
- Multiple voice options
- Paid service ($5-$99/month)
- API available for automation

#### Google Cloud Text-to-Speech
- Neural voices available
- Pay-as-you-go pricing
- Good for batch processing
- Requires GCP account

#### Amazon Polly
- AWS text-to-speech service
- Neural TTS available
- Pay-per-use pricing
- Integration with AWS ecosystem

#### OpenAI TTS API
- GPT-4 quality voices
- API-first approach
- Pay per character
- Easy integration with existing code

## 📝 Transcript Extraction for Audio Generation

Each episode page contains a complete transcript in the "Transcript" section. To extract for NotebookLM:

### Manual Extraction (Quick):
1. Open episode page in browser
2. Navigate to Transcript section
3. Copy all text content (excluding HTML tags)
4. Paste into NotebookLM

### Automated Extraction (Script):

```bash
# Extract transcript from HTML (removes tags, keeps content)
node extract-transcripts.cjs

# This will create 10 .txt files in /garrido/transcripts/
# ep01-chaos-transcript.txt
# ep02-respect-transcript.txt
# ... etc.
```

## 🔗 Download Link Configuration

Each episode page has two download links that need to be updated:

### Current Placeholder Links:
```html
<a href="#" class="download-btn">
    <i class="fas fa-download"></i>
    Download MP3
</a>
```

### Update to Actual Paths:
```html
<a href="/garrido/audio/ep01-chaos.mp3" download="ep01-chaos-audio.mp3" class="download-btn">
    <i class="fas fa-download"></i>
    Download MP3
</a>
```

### Drill PDF Links:
```html
<a href="/garrido/downloads/ep01-drills.pdf" download="ep01-chaos-drills.pdf" class="download-btn">
    <i class="fas fa-file-pdf"></i>
    Download Drill Sheet PDF
</a>
```

### Metrics Template Links:
```html
<a href="/garrido/downloads/ep01-chaos-metrics.csv" download="ep01-chaos-metrics.csv" class="download-btn">
    <i class="fas fa-table"></i>
    Download Metrics Spreadsheet
</a>
```

## 🧪 Testing Audio Integration

### Test Checklist:

1. **Local Testing**:
   ```bash
   # Start local server
   cd /Users/AustinHumphrey/BSI
   npx http-server -p 8080

   # Open in browser
   open http://localhost:8080/garrido/chaos
   ```

2. **Verify Audio Player**:
   - [ ] Audio controls visible
   - [ ] Play/pause button works
   - [ ] Volume slider responsive
   - [ ] Progress bar displays
   - [ ] Download button functional

3. **Cross-Browser Testing**:
   - [ ] Chrome/Edge (Chromium)
   - [ ] Safari (WebKit)
   - [ ] Firefox (Gecko)
   - [ ] Mobile Safari (iOS)
   - [ ] Chrome Mobile (Android)

4. **Mobile Responsiveness**:
   - [ ] Audio player fits screen width
   - [ ] Controls accessible on touch
   - [ ] Background graphics don't interfere
   - [ ] Download links work on mobile

## 📊 Current Status

### ✅ Completed:
- [x] Audio directory created (`/garrido/audio/`)
- [x] HTML5 audio players integrated into all 10 episode pages
- [x] Audio source paths configured (ep01-chaos.mp3 → ep10-legacy.mp3)
- [x] Fallback text displayed when audio unavailable
- [x] Drill PDF templates generated (10 episodes)
- [x] Metrics CSV templates created (11 files: 1 base + 10 episode-specific)

### ⏳ Pending:
- [ ] Generate 10 MP3 audio files via NotebookLM
- [ ] Upload MP3 files to `/garrido/audio/` directory
- [ ] Update download links to point to actual files
- [ ] Test audio playback on at least one episode
- [ ] Verify mobile audio player functionality
- [ ] Deploy updated pages to Cloudflare Pages

## 🚀 Deployment

Once audio files are ready:

```bash
# Deploy to Cloudflare Pages
cd /Users/AustinHumphrey/BSI
~/.npm-global/bin/wrangler pages deploy . --project-name blazesportsintel --branch main --commit-message="🎵 GARRIDO CODE: Complete audio integration for all 10 episodes with NotebookLM-ready players"
```

## 📦 File Structure

```
garrido/
├── audio/                          # Audio files (MP3)
│   ├── ep01-chaos.mp3             # (pending generation)
│   ├── ep02-respect.mp3           # (pending generation)
│   ├── ... (8 more files)
│   └── ep10-legacy.mp3            # (pending generation)
├── downloads/                      # Downloadable resources
│   ├── ep01-drills.html           # PDF-ready drill sheets
│   ├── ep01-chaos-metrics.csv     # Metrics tracking templates
│   ├── ... (18 more files)
│   └── metrics-template-base.csv  # Base template
├── chaos.html                      # Episode 01 page ✅ Audio player integrated
├── respect.html                    # Episode 02 page ✅ Audio player integrated
├── ... (8 more episode pages)
└── legacy.html                     # Episode 10 page ✅ Audio player integrated
```

## 🎯 Next Actions

### Immediate (Today):
1. Generate first audio file via NotebookLM (test with EP01: Chaos)
2. Upload to `/garrido/audio/ep01-chaos.mp3`
3. Test playback on localhost
4. If successful, generate remaining 9 episodes

### Week 1:
1. Complete all 10 audio file generations
2. Update download links in all episode pages
3. Full QA testing (all browsers, mobile)
4. Deploy to production

### Week 2:
1. Monitor user engagement with audio
2. Collect feedback on NotebookLM audio quality
3. Consider adding chapter markers / timestamps
4. Explore podcast RSS feed generation

## 📚 Additional Resources

- **NotebookLM Documentation**: https://support.google.com/notebooklm
- **HTML5 Audio Element**: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
- **ElevenLabs API**: https://docs.elevenlabs.io
- **OpenAI TTS Guide**: https://platform.openai.com/docs/guides/text-to-speech

---

**Last Updated**: 2025-10-17
**Status**: Audio players integrated, files pending generation
**Contact**: austin@blazesportsintel.com
