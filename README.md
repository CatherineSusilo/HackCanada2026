
  # Adaptive Bedtime Story App

  This is a code bundle for Adaptive Bedtime Story App. The original project is available at https://www.figma.com/design/6sPpirwhvJvw3pZgmAjS0X/Adaptive-Bedtime-Story-App.

## Inspiration
Every parent knows the bedtime struggle — children who are too wound up, too restless, or simply not ready to sleep. We noticed that traditional bedtime routines are one-size-fits-all: the same story, the same pace, regardless of how the child is actually feeling. We wondered — what if a bedtime story could sense when a child is drifting off, and adapt in real time? What if it could weave in a child's favorite characters, respond to their choices, and gradually slow its rhythm as their heart rate drops? We built Idle to turn bedtime from a battle into a gentle, intelligent experience that meets each child exactly where they are.

## What it does
Idle is an adaptive bedtime story app that generates personalized AI stories, narrates them aloud, monitors a child's vitals contactlessly through an iPhone camera, and dynamically adjusts pacing to guide children to sleep.

- AI Story Generation — Gemini 2.0 Flash creates fully personalized stories based on the child's personality profile, selected themes, parent prompts, and custom characters — complete with five AI-generated scene illustrations.
- Voice Narration — ElevenLabs narrates each paragraph with natural voices, and parents can even clone their own voice so their child hears a familiar one.
- Interactive Learning Moments — Stories embed branching choices, comprehension quizzes, and creative drawing prompts generated contextually by the AI.
- Contactless Vitals Monitoring — An iOS companion app uses the Presage SmartSpectra SDK to measure heart rate and breathing rate through the iPhone's front camera — no wearables needed.
- Drift Score — A proprietary 0–100% metric blends time-based progression with real-time physiological data, creating a feedback loop between the story and the child's body. When the child falls asleep, the story auto-completes.
- Behavioral Analytics Dashboard — Parents track vitals trends, engagement metrics, sleep statistics, and story history over time, with the ability to export vitals data as Excel spreadsheets for pediatric use.
- Gamified Story Roadmap — A milestone-based progression system motivates consistent bedtime routines.

## How we built it
- Frontend: React 18 + TypeScript + Vite with Tailwind CSS, Framer Motion animations, Recharts for data visualization, and Radix UI/shadcn components — all styled with a hand-drawn storybook aesthetic.
- Backend: Node.js/Express with Prisma ORM connected to MongoDB Atlas, secured with Auth0 JWT authentication, Helmet, and CORS.
- AI Pipeline: Google Gemini 2.0 Flash for story generation, interactive element creation, character voice matching, and theme extraction. Gemini 2.0 Flash Exp for scene illustration generation.
- Voice: ElevenLabs API for text-to-speech narration and parent voice cloning, with Web Speech API as fallback.
- iOS Companion App: Native SwiftUI app embedding the web experience in a WKWebView, with a bidirectional JavaScript bridge. The Presage SmartSpectra SDK runs the camera sensor invisibly (opacity 0) and posts vitals to the backend every 5 seconds.
- Data Export: SheetJS (xlsx) for client-side Excel generation of vitals data.

## Challenges we ran into
- Bridging iOS and React — Establishing reliable bidirectional communication between the native SmartSpectra SDK and the React web app required careful coordination of WKScriptMessageHandlers and CustomEvents, with edge cases around camera permissions and monitoring lifecycle.
- Prisma + MongoDB type conflicts — The generated Prisma client frequently went stale, causing phantom TypeScript errors that didn't appear in compilation but blocked the IDE. We had to repeatedly regenerate the client and restart the TS server.
- Auth middleware across routes — Some routes needed public access (iOS vitals posting) while others required full JWT auth, creating confusion when routes like /api/vitals/child/:childId silently returned 401 because the auth middleware wasn't applied at the route-handler level.

## Accomplishments that we're proud of
Interactive stories that branch — Children don't just listen passively; their choices alter the narrative via AI-generated bridge texts, making every session unique.

## What we learned
- Real-time biometric data is messy — Signal quality varies wildly, and building reliable sleep detection from noisy camera-based readings requires careful thresholding and noise tolerance.
- AI generation needs guardrails — Gemini is powerful but unpredictable. We learned to structure prompts with rigid JSON output schemas, chain-of-thought reasoning, and fallback parsing to handle malformed responses.

## What's next for Idle
- Multi-language support — Generate and narrate stories in the child's native language using Gemini's multilingual capabilities.
- Pediatric insights — Partner with sleep researchers to turn the longitudinal vitals data into clinically meaningful sleep quality assessments.
- Content safety filtering — Implement real-time explicit content detection on all AI-generated stories, images, and voice outputs to ensure every piece of content is age-appropriate and safe before it reaches the child.
- Projector mode for reduced screen time — Support casting stories to a ceiling or wall projector so the child isn't staring at a bright screen at bedtime, preserving melatonin production and healthier sleep onset.
- Nanny cam integration — Connect to existing home baby monitors and nanny cams to capture real-time video of the child during storytime, enabling visual sleep detection (eyes closed, movement cessation) alongside the contactless vitals monitoring for more accurate drift scoring.


  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
