import { LearningLevel } from '../types';

/**
 * L4: DOMAIN LOGIC LAYER
 * Centralized business rules to prevent logic leakage into UI components.
 */

export const DomainRules = {
  /**
   * THE LAW OF RESISTANCE (Cognitive Cost)
   * Information cannot be created in a vacuum. It must be anchored.
   * A question is valid only if:
   * 1. It links to existing knowledge ([[...]]) OR
   * 2. It anchors to an external asset (@...) OR
   * 3. It has sufficient depth (> 20 chars) to stand alone temporarily.
   */
  validateCognitiveCost: (content: string): boolean => {
    const hasInternalLink = content.includes('[[');
    const hasAssetAnchor = content.includes('@');
    const hasSufficientMass = content.length > 20;

    return hasInternalLink || hasAssetAnchor || hasSufficientMass;
  },

  /**
   * THE LAW OF ENTROPY (Decay)
   * Calculates the visual opacity of a node based on its last update.
   * Returns a value between 0.3 (Fully Decayed) and 1.0 (Fresh).
   */
  calculateEntropy: (lastUpdated: string): number => {
    const now = new Date().getTime();
    const updated = new Date(lastUpdated).getTime();
    const daysOld = (now - updated) / (1000 * 60 * 60 * 24);

    // 14 Days of freshness, then linear decay over 60 days
    if (daysOld <= 14) return 1.0;
    
    // Decay formula: max(0.3, 1 - (daysOver14 / 60))
    return Math.max(0.3, 1 - (daysOld - 14) / 60);
  },

  /**
   * Validation for Objectives
   * An Objective must be strategic, not just a task.
   */
  validateObjectiveConfig: (title: string, krCount: number): boolean => {
    return title.length > 5 && krCount > 0;
  }
};
