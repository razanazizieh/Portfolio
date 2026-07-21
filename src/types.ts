/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Project {
  id: string;
  title: string;
  subtitle?: string;
  category: "FULL-STACK" | "CODE" | "UI";
  year?: string;
  overview?: string;
  myRole?: string;
  technicalHighlights?: string[];
  technology?: string[];
  gallery?: (string | { label: string; image: string })[];
  impact?: string;
  challenge?: string;
  solution?: string;
  image?: string; // URL reference or imported image path
  secondaryImage?: string; // Secondary project image mockup
  live?: string;
  repository?: string;
  projectType?: string;
}

export interface VisitorMessage {
  id: string;
  name: string;
  message: string;
  createdAt: number; // Unix timestamp
}
