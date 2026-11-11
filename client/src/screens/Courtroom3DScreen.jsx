import React, { useEffect } from 'react';
import { useCourtStore } from '../store/courtStore.js';
import { CourtroomScene } from '../components/3d/CourtroomScene.jsx';
import { CourtHUD } from '../components/hud/CourtHUD.jsx';

/**
 * 3D Courtroom Screen:
 * Integrates the R3F Canvas and the interactive HTML HUD overlay
 * driven by the reactive Zustand courtStore.
 */
export function Courtroom3DScreen({ onBack }) {
  const initSession = useCourtStore((s) => s.initSession);
  const cleanupSession = useCourtStore((s) => s.cleanupSession);

  const speaker = useCourtStore((s) => s.speaker);
  const objectionActive = useCourtStore((s) => s.objectionActive);
  const objectingSide = useCourtStore((s) => s.objectingSide);
  const gavelStriking = useCourtStore((s) => s.gavelStriking);

  const petitionerName = useCourtStore((s) => s.petitionerName);
  const respondentName = useCourtStore((s) => s.respondentName);
  const respondentJoined = useCourtStore((s) => s.respondentJoined);
  const judgePersona = useCourtStore((s) => s.judgePersona);

  // Initialize session tickers on mount
  useEffect(() => {
    initSession();
    return () => cleanupSession();
  }, [initSession, cleanupSession]);

  // Derive character animation states
  const judgeState = speaker === 'j' ? 'talking' : 'idle';

  const petitionerState =
    objectingSide === 'pet'
      ? 'objecting'
      : speaker === 'pet'
      ? 'talking'
      : 'idle';

  const respondentState =
    objectingSide === 'res'
      ? 'objecting'
      : speaker === 'res'
      ? 'talking'
      : 'idle';

  return (
    <CourtHUD onBack={onBack}>
      <CourtroomScene
        judgePersona={judgePersona}
        judgeState={judgeState}
        petitionerName={petitionerName}
        petitionerState={petitionerState}
        respondentName={respondentName}
        respondentState={respondentState}
        respondentGhosted={!respondentJoined}
        gavelStriking={gavelStriking}
      />
    </CourtHUD>
  );
}


