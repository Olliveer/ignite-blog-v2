/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useState } from 'react';
import { useUtterances } from '../../hooks/useUtterances';

const commentNodeId = 'comments';

export const Comments = () => {
  useUtterances(commentNodeId);
  return <div id={commentNodeId} />;
};
