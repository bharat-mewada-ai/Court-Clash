import { create } from 'zustand';

/**
 * Mock AI Judge Response Provider
 * Easily swappable with backend RAG API or FastAPI service
 */
export async function getJudgeResponse(context) {
  // Simulate network latency (300ms)
  await new Promise((res) => setTimeout(res, 300));

  const { eventType, text, speaker, articlesInPlay } = context;

  if (eventType === 'SUBMISSION') {
    const nextCounsel = speaker === 'pet' ? 'Respondent' : 'Petitioner';
    return {
      text: `Noted. ${nextCounsel}, you may present your counter-submission.`,
      ruling: 'NONE',
      speaker: 'j'
    };
  }

  if (eventType === 'OBJECTION') {
    const isSustained = Math.random() > 0.45;
    return {
      text: isSustained
        ? 'Objection SUSTAINED! Counsel, reframe your argument on constitutional grounds.'
        : 'Objection OVERRULED! The submission is relevant; counsel may proceed.',
      ruling: isSustained ? 'SUSTAINED' : 'OVERRULED',
      speaker: 'j'
    };
  }

  if (eventType === 'CITE') {
    return {
      text: `${text} cited. The bench has entered the provision into the judicial record.`,
      ruling: 'NONE',
      speaker: 'j'
    };
  }

  return {
    text: 'Counsel, proceed with your oral arguments.',
    ruling: 'NONE',
    speaker: 'j'
  };
}

const SHOUTS_POOL = [
  { user: 'Rohan_NLU', text: 'Bench strictly rules pe chal rahi hai aaj 🔥' },
  { user: 'Pooja_Law', text: 'Dekhte hain citation kitni solid aati hai! ⚖️' },
  { user: 'Kabir_X', text: 'Objection aane wala hai, feel ho raha hai 🍿' },
  { user: 'Sana_J', text: 'Credibility score gir gaya kya?' },
  { user: 'Ananya_DU', text: 'Article 19 argument spot on tha bhai 👏' },
  { user: 'Vikram_NLSIU', text: 'Order order! Judge saab full form me hain' }
];

const QUICK_ARTICLES = ['Art. 14', 'Art. 19', 'Art. 21', 'Art. 32'];

export const useCourtStore = create((set, get) => {
  let timerInterval = null;
  let shoutInterval = null;
  let capTimeout = null;
  let shoutTimeout = null;

  return {
    // --- Room & Turn State ---
    phase: 'ROUND_1_OPENING',
    statusText: 'Pending case filing',
    currentTurn: 'petitioner', // 'petitioner' | 'respondent'
    speaker: null, // 'pet' | 'res' | 'j' | null
    speakerName: '',
    speakerText: '',
    captionVisible: false,
    lastSpeaker: 'pet',

    respondentJoined: false,
    petitionerName: 'Aarav Sharma',
    respondentName: 'Meera Iyer',
    judgePersona: 'Strict',

    articlesInPlay: [],
    articleIndex: 0,
    credibility: { petitioner: 85, respondent: 85 },
    transcript: [],
    timer: 60,

    // --- 3D Scene Controls ---
    cameraShot: 'wide', // 'wide' | 'pet' | 'res' | 'j' | 'petObj' | 'resObj'
    objectionActive: false, // Triggers visual popup & screen flash
    objectingSide: null, // 'pet' | 'res' | null
    gavelStriking: false,
    activeShout: null,
    isBusy: false,

    // --- Actions ---

    /**
     * Start Background Timers & Audience Shouts
     */
    initSession: () => {
      // Clear any prior intervals
      if (timerInterval) clearInterval(timerInterval);
      if (shoutInterval) clearInterval(shoutInterval);

      // Initial audience shout
      setTimeout(() => {
        get().triggerShout(SHOUTS_POOL[0].user, SHOUTS_POOL[0].text);
      }, 1500);

      // Initial judge welcoming prompt
      setTimeout(() => {
        get().say(
          'j',
          'Counsel, you may present your oral submissions. You have 60 seconds.',
          3600,
          'j'
        );
      }, 800);

      // Timer ticker
      timerInterval = setInterval(() => {
        set((state) => ({
          timer: state.timer > 0 ? state.timer - 1 : 60
        }));
      }, 1000);

      // Audience shout periodic rotation (every 7 seconds)
      let shoutIdx = 1;
      shoutInterval = setInterval(() => {
        const item = SHOUTS_POOL[shoutIdx % SHOUTS_POOL.length];
        shoutIdx++;
        get().triggerShout(item.user, item.text);
      }, 7500);
    },

    cleanupSession: () => {
      if (timerInterval) clearInterval(timerInterval);
      if (shoutInterval) clearInterval(shoutInterval);
      if (capTimeout) clearTimeout(capTimeout);
      if (shoutTimeout) clearTimeout(shoutTimeout);
    },

    /**
     * Display speech caption and cut camera
     */
    say: (speakerRole, text, durationMs = 3200, shotName = null) => {
      const { petitionerName, respondentName } = get();
      const names = { pet: petitionerName, res: respondentName, j: 'Judge' };
      const resolvedShot = shotName || speakerRole;

      set({
        speaker: speakerRole,
        speakerName: names[speakerRole] || 'Speaker',
        speakerText: text,
        captionVisible: true,
        cameraShot: resolvedShot
      });

      if (capTimeout) clearTimeout(capTimeout);
      capTimeout = setTimeout(() => {
        set({
          speaker: null,
          captionVisible: false,
          cameraShot: 'wide'
        });
      }, durationMs);
    },

    /**
     * Submit Counsel Argument
     */
    submitArgument: async (customText) => {
      const state = get();
      if (state.isBusy) return;

      set({ isBusy: true });

      // Join respondent if not yet joined
      if (!state.respondentJoined) {
        get().joinRespondent();
      }

      const defaultPetArg =
        'My lord, the petitioner’s right to speak freely under Article 19 was curtailed without due process.';
      const defaultResArg =
        'Learned Judge, reasonable restrictions under Article 19(2) apply to preserve university discipline.';

      // Determine active side: alternates if respondent joined, else petitioner
      const currentRole = state.respondentJoined
        ? state.lastSpeaker === 'pet'
          ? 'res'
          : 'pet'
        : 'pet';

      const argumentText =
        (customText && customText.trim()) ||
        (currentRole === 'pet' ? defaultPetArg : defaultResArg);

      // Record transcript entry
      const newEntry = {
        id: `tr-${Date.now()}`,
        speaker: currentRole === 'pet' ? state.petitionerName : state.respondentName,
        side: currentRole === 'pet' ? 'petitioner' : 'respondent',
        text: argumentText,
        timestamp: new Date().toISOString()
      };

      set((s) => ({
        transcript: [...s.transcript, newEntry],
        lastSpeaker: currentRole
      }));

      // Speak argument
      get().say(currentRole, argumentText, 3400, currentRole);

      // Judge reply after argument completes
      setTimeout(async () => {
        const judgeResp = await getJudgeResponse({
          eventType: 'SUBMISSION',
          text: argumentText,
          speaker: currentRole,
          articlesInPlay: get().articlesInPlay
        });

        get().say('j', judgeResp.text, 2400, 'j');

        // Record judge commentary in transcript
        set((s) => ({
          transcript: [
            ...s.transcript,
            {
              id: `tr-${Date.now()}`,
              speaker: 'Judge',
              side: 'judge',
              text: judgeResp.text,
              timestamp: new Date().toISOString()
            }
          ]
        }));
      }, 3800);

      // Unlock turn
      setTimeout(() => {
        set({ isBusy: false });
      }, 6400);
    },

    /**
     * Raise Objection
     */
    raiseObjection: () => {
      const state = get();
      if (state.isBusy) return;

      set({ isBusy: true });

      if (!state.respondentJoined) {
        get().joinRespondent();
      }

      // Objecting side is opponent of last speaker
      const objectingSide = state.lastSpeaker === 'pet' ? 'res' : 'pet';
      const shotName = objectingSide === 'pet' ? 'petObj' : 'resObj';

      set({
        objectionActive: true,
        objectingSide,
        speaker: objectingSide,
        cameraShot: shotName
      });

      // Record objection in transcript
      const objectorName =
        objectingSide === 'pet' ? state.petitionerName : state.respondentName;

      set((s) => ({
        transcript: [
          ...s.transcript,
          {
            id: `tr-${Date.now()}`,
            speaker: objectorName,
            side: objectingSide === 'pet' ? 'petitioner' : 'respondent',
            text: 'OBJECTION! The argument misinterprets constitutional grounds!',
            timestamp: new Date().toISOString()
          }
        ]
      }));

      // Dismiss objection overlay and deliver judge ruling
      setTimeout(async () => {
        set({
          objectionActive: false,
          objectingSide: null,
          speaker: null,
          gavelStriking: true
        });

        // Reset gavel strike flag after brief moment
        setTimeout(() => set({ gavelStriking: false }), 800);

        const judgeResp = await getJudgeResponse({
          eventType: 'OBJECTION',
          speaker: objectingSide,
          articlesInPlay: get().articlesInPlay
        });

        get().say('j', judgeResp.text, 2500, 'j');

        // Update credibility score
        const isSustained = judgeResp.ruling === 'SUSTAINED';
        set((s) => {
          const deltaObjector = isSustained ? 6 : -5;
          const otherSide = objectingSide === 'pet' ? 'respondent' : 'petitioner';
          const targetKey = objectingSide === 'pet' ? 'petitioner' : 'respondent';

          return {
            credibility: {
              ...s.credibility,
              [targetKey]: Math.min(100, Math.max(20, s.credibility[targetKey] + deltaObjector)),
              [otherSide]: Math.min(100, Math.max(20, s.credibility[otherSide] - (isSustained ? 4 : 0)))
            },
            transcript: [
              ...s.transcript,
              {
                id: `tr-${Date.now()}`,
                speaker: 'Judge',
                side: 'judge',
                text: `RULING: ${judgeResp.text}`,
                timestamp: new Date().toISOString()
              }
            ]
          };
        });
      }, 1500);

      // Unlock turn
      setTimeout(() => {
        set({ isBusy: false });
      }, 4300);
    },

    /**
     * Cite Constitutional Article
     */
    citeArticle: (customArticle) => {
      const state = get();
      const articleToCite =
        customArticle ||
        QUICK_ARTICLES[state.articleIndex % QUICK_ARTICLES.length];

      const nextIndex = state.articleIndex + 1;
      const isNew = !state.articlesInPlay.includes(articleToCite);
      const updatedArticles = isNew
        ? [...state.articlesInPlay, articleToCite]
        : state.articlesInPlay;

      set({
        articlesInPlay: updatedArticles,
        articleIndex: nextIndex,
        statusText: `Active Article: ${articleToCite}`
      });

      get().say('j', `${articleToCite} cited. The bench has noted it into the record.`, 2200, 'j');

      set((s) => ({
        transcript: [
          ...s.transcript,
          {
            id: `tr-${Date.now()}`,
            speaker: 'System',
            side: 'system',
            text: `Constitutional provision ${articleToCite} entered into play.`,
            timestamp: new Date().toISOString()
          }
        ]
      }));
    },

    /**
     * Respondent Joins Session
     */
    joinRespondent: (name = 'Meera Iyer') => {
      if (get().respondentJoined) return;
      set({
        respondentJoined: true,
        respondentName: name,
        statusText: 'Trial in session'
      });
      get().triggerShout('System', `${name} joined as respondent.`);
    },

    /**
     * Push Audience Shout Banner
     */
    triggerShout: (user, text) => {
      set({ activeShout: { user, text } });
      if (shoutTimeout) clearTimeout(shoutTimeout);
      shoutTimeout = setTimeout(() => {
        set({ activeShout: null });
      }, 3400);
    },

    setCameraShot: (shot) => set({ cameraShot: shot })
  };
});

