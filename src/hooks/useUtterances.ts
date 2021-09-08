/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useEffect, useState } from 'react';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useUtterances = (commentNodeId: string) => {
  useEffect(() => {
    const scriptParentNode = document.getElementById(commentNodeId);
    if (!scriptParentNode) return;
    // docs - https://utteranc.es/
    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.setAttribute('repo', 'Olliveer/ignite-blog-v2');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('label', 'comment :speech_balloon:');
    script.setAttribute('theme', 'photon-dark');
    script.setAttribute('crossorigin', 'anonymous');

    scriptParentNode.appendChild(script);

    // eslint-disable-next-line consistent-return
    return () => {
      // cleanup - remove the older script with previous theme
      scriptParentNode.removeChild(scriptParentNode.firstChild);
    };
  }, [commentNodeId]);
};
