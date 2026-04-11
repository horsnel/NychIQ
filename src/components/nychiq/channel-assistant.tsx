'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNychIQStore, type AssistantCharacter } from '@/lib/store';

/* ── Constants ── */
const TYPING_SPEED = 30; // ms per character
const AUTO_DISMISS_DELAY = 2000; // ms after typing completes
const PURPLE_GLOW = '#8B5CF6';

/* ── Character SVG Components ── */

function DogCharacter() {
  return (
    <svg viewBox="0 0 120 160" fill="none" className="w-full h-full" aria-label="Dog character">
      {/* Purple aura glow */}
      <defs>
        <radialGradient id="dog-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={PURPLE_GLOW} stopOpacity="0.3" />
          <stop offset="70%" stopColor={PURPLE_GLOW} stopOpacity="0.1" />
          <stop offset="100%" stopColor={PURPLE_GLOW} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dog-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDBA2D" />
          <stop offset="100%" stopColor="#D4891A" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="100" rx="55" ry="55" fill="url(#dog-aura)" />

      {/* Body */}
      <ellipse cx="60" cy="130" rx="30" ry="22" fill="url(#dog-body)" />
      {/* Chest patch */}
      <ellipse cx="60" cy="126" rx="16" ry="14" fill="#FFD07B" />

      {/* Head */}
      <circle cx="60" cy="72" r="26" fill="#FDBA2D" />
      {/* Left ear (floppy) */}
      <ellipse cx="34" cy="54" rx="10" ry="20" fill="#D4891A" transform="rotate(-15 34 54)" />
      {/* Right ear (floppy) */}
      <ellipse cx="86" cy="54" rx="10" ry="20" fill="#D4891A" transform="rotate(15 86 54)" />

      {/* Snout */}
      <ellipse cx="60" cy="82" rx="14" ry="10" fill="#FFD07B" />
      {/* Nose */}
      <ellipse cx="60" cy="78" rx="5" ry="3.5" fill="#3A2A1A" />
      {/* Mouth line */}
      <path d="M55 83 Q60 88 65 83" stroke="#3A2A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Eyes */}
      <circle cx="49" cy="68" r="5" fill="white" />
      <circle cx="71" cy="68" r="5" fill="white" />
      <circle cx="50" cy="67" r="3" fill="#2A1A0A" />
      <circle cx="72" cy="67" r="3" fill="#2A1A0A" />
      {/* Eye highlights */}
      <circle cx="51.5" cy="65.5" r="1.2" fill="white" />
      <circle cx="73.5" cy="65.5" r="1.2" fill="white" />

      {/* Eyebrows (happy) */}
      <path d="M43 61 Q49 58 55 61" stroke="#3A2A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M65 61 Q71 58 77 61" stroke="#3A2A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Tongue (cute) */}
      <ellipse cx="60" cy="90" rx="4" ry="5" fill="#FF7B9C" />

      {/* Tail (wagging) */}
      <path d="M88 125 Q100 110 95 98" stroke="#FDBA2D" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function CatCharacter() {
  return (
    <svg viewBox="0 0 120 160" fill="none" className="w-full h-full" aria-label="Cat character">
      <defs>
        <radialGradient id="cat-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={PURPLE_GLOW} stopOpacity="0.3" />
          <stop offset="70%" stopColor={PURPLE_GLOW} stopOpacity="0.1" />
          <stop offset="100%" stopColor={PURPLE_GLOW} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cat-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B8B8B" />
          <stop offset="100%" stopColor="#6B6B6B" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="100" rx="55" ry="55" fill="url(#cat-aura)" />

      {/* Body */}
      <ellipse cx="60" cy="130" rx="26" ry="22" fill="url(#cat-body)" />
      {/* Belly */}
      <ellipse cx="60" cy="132" rx="14" ry="16" fill="#B0B0B0" />

      {/* Tail (curled) */}
      <path d="M84 128 Q105 115 100 95 Q96 82 88 85" stroke="#8B8B8B" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* Head */}
      <circle cx="60" cy="72" r="25" fill="#8B8B8B" />
      {/* Left ear (pointed) */}
      <polygon points="38,52 30,28 48,44" fill="#8B8B8B" />
      <polygon points="40,50 34,32 47,44" fill="#FFB0C0" />
      {/* Right ear (pointed) */}
      <polygon points="82,52 90,28 72,44" fill="#8B8B8B" />
      <polygon points="80,50 86,32 73,44" fill="#FFB0C0" />

      {/* Face fur pattern */}
      <ellipse cx="60" cy="78" rx="16" ry="12" fill="#B0B0B0" />

      {/* Eyes (cat-like, slanted) */}
      <ellipse cx="50" cy="68" rx="5" ry="6" fill="#A8E6A3" />
      <ellipse cx="70" cy="68" rx="5" ry="6" fill="#A8E6A3" />
      <ellipse cx="50" cy="68" rx="2" ry="5" fill="#1A1A2A" />
      <ellipse cx="70" cy="68" rx="2" ry="5" fill="#1A1A2A" />
      {/* Eye highlights */}
      <circle cx="51.5" cy="66" r="1" fill="white" />
      <circle cx="71.5" cy="66" r="1" fill="white" />

      {/* Nose */}
      <polygon points="57,78 63,78 60,81" fill="#FFB0C0" />

      {/* Whiskers */}
      <line x1="30" y1="76" x2="48" y2="78" stroke="#CCCCCC" strokeWidth="1" strokeLinecap="round" />
      <line x1="28" y1="80" x2="48" y2="80" stroke="#CCCCCC" strokeWidth="1" strokeLinecap="round" />
      <line x1="72" y1="78" x2="90" y2="76" stroke="#CCCCCC" strokeWidth="1" strokeLinecap="round" />
      <line x1="72" y1="80" x2="92" y2="80" stroke="#CCCCCC" strokeWidth="1" strokeLinecap="round" />

      {/* Mouth */}
      <path d="M56 82 Q60 86 64 82" stroke="#5A5A5A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function BoyCharacter() {
  return (
    <svg viewBox="0 0 120 160" fill="none" className="w-full h-full" aria-label="Boy character">
      <defs>
        <radialGradient id="boy-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={PURPLE_GLOW} stopOpacity="0.3" />
          <stop offset="70%" stopColor={PURPLE_GLOW} stopOpacity="0.1" />
          <stop offset="100%" stopColor={PURPLE_GLOW} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="boy-shirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="boy-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5C6A0" />
          <stop offset="100%" stopColor="#E8B88A" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="100" rx="55" ry="55" fill="url(#boy-aura)" />

      {/* Body / Shirt */}
      <path d="M30 100 Q30 88 42 88 L78 88 Q90 88 90 100 L90 155 L30 155 Z" fill="url(#boy-shirt)" rx="8" />
      {/* Shirt collar */}
      <path d="M48 88 L60 96 L72 88" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Shirt pocket */}
      <rect x="62" y="102" width="12" height="10" rx="2" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />

      {/* Neck */}
      <rect x="52" y="82" width="16" height="10" fill="url(#boy-skin)" rx="2" />

      {/* Head */}
      <circle cx="60" cy="60" r="26" fill="url(#boy-skin)" />

      {/* Hair (short, spiky) */}
      <path d="M34 55 Q36 30 50 28 Q56 27 60 30 Q64 27 70 28 Q84 30 86 55" fill="#3A2A1A" />
      <path d="M38 52 Q42 32 52 30" fill="#3A2A1A" />
      <path d="M58 30 Q60 25 65 28" fill="#3A2A1A" />
      <path d="M72 32 Q78 30 82 48" fill="#3A2A1A" />

      {/* Eyes */}
      <circle cx="49" cy="58" r="5" fill="white" />
      <circle cx="71" cy="58" r="5" fill="white" />
      <circle cx="50" cy="57" r="3" fill="#2A1A0A" />
      <circle cx="72" cy="57" r="3" fill="#2A1A0A" />
      {/* Eye highlights */}
      <circle cx="51.5" cy="55.5" r="1.2" fill="white" />
      <circle cx="73.5" cy="55.5" r="1.2" fill="white" />

      {/* Eyebrows */}
      <path d="M43 50 Q49 47 55 50" stroke="#3A2A1A" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M65 50 Q71 47 77 50" stroke="#3A2A1A" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <path d="M58 64 Q60 67 62 64" stroke="#D4A07A" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Smile */}
      <path d="M50 72 Q60 80 70 72" stroke="#C47A5A" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* Cheeks (blush) */}
      <circle cx="40" cy="68" r="5" fill="rgba(255,150,150,0.25)" />
      <circle cx="80" cy="68" r="5" fill="rgba(255,150,150,0.25)" />
    </svg>
  );
}

function GirlCharacter() {
  return (
    <svg viewBox="0 0 120 160" fill="none" className="w-full h-full" aria-label="Girl character">
      <defs>
        <radialGradient id="girl-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={PURPLE_GLOW} stopOpacity="0.3" />
          <stop offset="70%" stopColor={PURPLE_GLOW} stopOpacity="0.1" />
          <stop offset="100%" stopColor={PURPLE_GLOW} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="girl-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
        <linearGradient id="girl-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDDCB5" />
          <stop offset="100%" stopColor="#F0C8A0" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="100" rx="55" ry="55" fill="url(#girl-aura)" />

      {/* Body / Top */}
      <path d="M30 100 Q30 88 42 88 L78 88 Q90 88 90 100 L90 155 L30 155 Z" fill="url(#girl-top)" rx="8" />
      {/* Neckline */}
      <path d="M46 88 Q60 98 74 88" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Neck */}
      <rect x="52" y="82" width="16" height="10" fill="url(#girl-skin)" rx="2" />

      {/* Hair (long, flowing past shoulders) */}
      <path d="M34 60 Q30 30 50 24 Q60 22 70 24 Q90 30 86 60 Q88 75 85 100 Q84 110 80 115" fill="#5A2A0A" />
      <path d="M34 60 Q32 75 35 100 Q36 110 40 115" fill="#5A2A0A" />
      {/* Hair back part */}
      <path d="M32 56 Q30 80 34 110 L44 110 Q40 85 40 60 Z" fill="#4A200A" />
      <path d="M88 56 Q90 80 86 110 L76 110 Q80 85 80 60 Z" fill="#4A200A" />

      {/* Head */}
      <circle cx="60" cy="58" r="24" fill="url(#girl-skin)" />

      {/* Bangs */}
      <path d="M36 52 Q38 28 52 24 Q58 22 62 24 Q68 22 76 28 Q84 34 84 52 Q80 42 70 38 Q60 35 50 38 Q40 42 36 52 Z" fill="#5A2A0A" />

      {/* Hair accessory (bow) */}
      <circle cx="80" cy="42" r="4" fill="#EC4899" />
      <circle cx="74" cy="38" r="3" fill="#EC4899" />
      <circle cx="86" cy="38" r="3" fill="#EC4899" />

      {/* Eyes (bigger, more expressive) */}
      <ellipse cx="50" cy="56" rx="5" ry="5.5" fill="white" />
      <ellipse cx="70" cy="56" rx="5" ry="5.5" fill="white" />
      <circle cx="51" cy="55" r="3.2" fill="#4A2A5A" />
      <circle cx="71" cy="55" r="3.2" fill="#4A2A5A" />
      {/* Eye highlights */}
      <circle cx="52.5" cy="53.5" r="1.3" fill="white" />
      <circle cx="72.5" cy="53.5" r="1.3" fill="white" />
      {/* Eyelashes */}
      <path d="M44 53 Q46 50 48 52" stroke="#3A2A1A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M72 52 Q74 50 76 53" stroke="#3A2A1A" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Eyebrows (thin, arched) */}
      <path d="M44 48 Q50 45 55 48" stroke="#5A2A0A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M65 48 Q70 45 76 48" stroke="#5A2A0A" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <circle cx="60" cy="62" r="1.5" fill="#E8B89A" />

      {/* Smile */}
      <path d="M52 69 Q60 76 68 69" stroke="#C47A5A" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* Cheeks (blush) */}
      <circle cx="41" cy="64" r="5" fill="rgba(255,140,160,0.3)" />
      <circle cx="79" cy="64" r="5" fill="rgba(255,140,160,0.3)" />
    </svg>
  );
}

function ManCharacter() {
  return (
    <svg viewBox="0 0 120 160" fill="none" className="w-full h-full" aria-label="Man character">
      <defs>
        <radialGradient id="man-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={PURPLE_GLOW} stopOpacity="0.3" />
          <stop offset="70%" stopColor={PURPLE_GLOW} stopOpacity="0.1" />
          <stop offset="100%" stopColor={PURPLE_GLOW} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="man-shirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="man-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8B89A" />
          <stop offset="100%" stopColor="#D4A07A" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="100" rx="55" ry="55" fill="url(#man-aura)" />

      {/* Body / Collared shirt */}
      <path d="M28 100 Q28 86 42 86 L78 86 Q92 86 92 100 L92 155 L28 155 Z" fill="url(#man-shirt)" rx="6" />
      {/* Collar */}
      <path d="M50 86 L46 78 L60 92 L74 78 L70 86" fill="#1E293B" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      {/* Tie */}
      <polygon points="58,92 62,92 63,120 60,124 57,120" fill="#DC2626" />
      {/* Button row */}
      <circle cx="60" cy="108" r="1.5" fill="rgba(255,255,255,0.15)" />
      <circle cx="60" cy="118" r="1.5" fill="rgba(255,255,255,0.15)" />

      {/* Neck */}
      <rect x="52" y="78" width="16" height="12" fill="url(#man-skin)" rx="2" />

      {/* Head */}
      <circle cx="60" cy="56" r="25" fill="url(#man-skin)" />

      {/* Hair (short, neat) */}
      <path d="M35 50 Q36 28 52 24 Q60 22 68 24 Q84 28 85 50 Q82 38 72 34 Q60 30 48 34 Q38 38 35 50 Z" fill="#1A1A2A" />
      {/* Side hair */}
      <path d="M35 50 Q34 56 35 62" stroke="#1A1A2A" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M85 50 Q86 56 85 62" stroke="#1A1A2A" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* Eyes */}
      <circle cx="49" cy="54" r="4.5" fill="white" />
      <circle cx="71" cy="54" r="4.5" fill="white" />
      <circle cx="50" cy="53.5" r="2.8" fill="#2A1A0A" />
      <circle cx="72" cy="53.5" r="2.8" fill="#2A1A0A" />
      {/* Eye highlights */}
      <circle cx="51.2" cy="52.2" r="1" fill="white" />
      <circle cx="73.2" cy="52.2" r="1" fill="white" />

      {/* Eyebrows (stronger) */}
      <path d="M42 46 Q49 43 56 46" stroke="#1A1A2A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M64 46 Q71 43 78 46" stroke="#1A1A2A" strokeWidth="2.2" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <path d="M57 60 Q60 65 63 60" stroke="#C49A6A" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Stubble hint */}
      <rect x="50" y="68" width="20" height="3" rx="1.5" fill="rgba(50,40,30,0.15)" />

      {/* Smile (confident) */}
      <path d="M50 72 Q55 76 60 74 Q65 76 70 72" stroke="#A07A5A" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Ears */}
      <ellipse cx="35" cy="56" rx="4" ry="6" fill="url(#man-skin)" />
      <ellipse cx="85" cy="56" rx="4" ry="6" fill="url(#man-skin)" />
    </svg>
  );
}

function WomanCharacter() {
  return (
    <svg viewBox="0 0 120 160" fill="none" className="w-full h-full" aria-label="Woman character">
      <defs>
        <radialGradient id="woman-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={PURPLE_GLOW} stopOpacity="0.3" />
          <stop offset="70%" stopColor={PURPLE_GLOW} stopOpacity="0.1" />
          <stop offset="100%" stopColor={PURPLE_GLOW} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="woman-blouse" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="woman-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDDCB5" />
          <stop offset="100%" stopColor="#F0C8A0" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="100" rx="55" ry="55" fill="url(#woman-aura)" />

      {/* Body / Blouse */}
      <path d="M30 100 Q30 88 42 88 L78 88 Q90 88 90 100 L90 155 L30 155 Z" fill="url(#woman-blouse)" rx="8" />
      {/* V-neckline */}
      <path d="M48 88 L60 104 L72 88" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Necklace */}
      <path d="M50 88 Q60 96 70 88" stroke="#F5D060" strokeWidth="1" fill="none" />
      <circle cx="60" cy="95" r="2.5" fill="#F5D060" />

      {/* Neck */}
      <rect x="52" y="80" width="16" height="12" fill="url(#woman-skin)" rx="2" />

      {/* Hair (long, wavy, past shoulders) */}
      <path d="M34 56 Q30 30 50 24 Q60 22 70 24 Q90 30 86 56 Q88 72 86 90 Q85 105 82 115" fill="#2A0A1A" />
      <path d="M34 56 Q32 72 34 90 Q35 105 38 115" fill="#2A0A1A" />
      {/* Hair wave details */}
      <path d="M34 70 Q38 68 36 76 Q34 84 38 86" stroke="#3A1A2A" strokeWidth="1" fill="none" />
      <path d="M86 70 Q82 68 84 76 Q86 84 82 86" stroke="#3A1A2A" strokeWidth="1" fill="none" />

      {/* Head */}
      <circle cx="60" cy="56" r="24" fill="url(#woman-skin)" />

      {/* Hair top / bangs (side-swept) */}
      <path d="M36 52 Q38 26 54 22 Q60 20 66 22 Q78 26 84 40 Q82 48 78 50 Q72 44 60 40 Q48 40 40 48 Z" fill="#2A0A1A" />
      {/* Highlight streak */}
      <path d="M55 22 Q62 24 68 28" stroke="#4A1A3A" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Eyes (elegant, almond-shaped) */}
      <path d="M44 54 Q49 49 55 54" stroke="white" strokeWidth="1" fill="white" />
      <path d="M65 54 Q70 49 76 54" stroke="white" strokeWidth="1" fill="white" />
      <circle cx="50" cy="53" r="3" fill="#5A2A6A" />
      <circle cx="70" cy="53" r="3" fill="#5A2A6A" />
      {/* Eye highlights */}
      <circle cx="51.5" cy="51.5" r="1.2" fill="white" />
      <circle cx="71.5" cy="51.5" r="1.2" fill="white" />
      {/* Eyelashes (longer) */}
      <path d="M43 53 Q44 50 46 51" stroke="#1A0A1A" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M74 51 Q76 50 77 53" stroke="#1A0A1A" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* Upper eyelid line */}
      <path d="M43 54 Q49 50 56 54" stroke="#1A0A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M64 54 Q71 50 77 54" stroke="#1A0A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Eyebrows (thin, arched) */}
      <path d="M44 47 Q49 44 55 47" stroke="#2A0A1A" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M65 47 Q71 44 76 47" stroke="#2A0A1A" strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <path d="M58 60 Q60 64 62 60" stroke="#E0B090" strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {/* Smile (elegant) */}
      <path d="M52 69 Q56 74 60 73 Q64 74 68 69" stroke="#C47A5A" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Lips color hint */}
      <path d="M53 69 Q60 73 67 69" stroke="#E87090" strokeWidth="0.8" fill="rgba(232,112,144,0.2)" strokeLinecap="round" />

      {/* Cheeks (subtle blush) */}
      <circle cx="42" cy="62" r="5" fill="rgba(255,130,150,0.2)" />
      <circle cx="78" cy="62" r="5" fill="rgba(255,130,150,0.2)" />

      {/* Earrings */}
      <circle cx="36" cy="62" r="2" fill="#F5D060" />
      <circle cx="84" cy="62" r="2" fill="#F5D060" />
    </svg>
  );
}

/* ── Character Map ── */
const CHARACTER_COMPONENTS: Record<AssistantCharacter, React.FC> = {
  dog: DogCharacter,
  cat: CatCharacter,
  boy: BoyCharacter,
  girl: GirlCharacter,
  man: ManCharacter,
  woman: WomanCharacter,
};

/* ── Typing cursor component ── */
function TypingCursor() {
  return (
    <span
      className="inline-block w-[2px] h-[1.1em] bg-[#333] ml-0.5 align-middle"
      style={{
        animation: 'nychiq-blink 0.8s step-end infinite',
      }}
    />
  );
}

/* ── Main Component ── */
export function ChannelAssistant() {
  const assistantConfig = useNychIQStore((s) => s.assistantConfig);
  const assistantMessages = useNychIQStore((s) => s.assistantMessages);
  const assistantVisible = useNychIQStore((s) => s.assistantVisible);
  const setAssistantVisible = useNychIQStore((s) => s.setAssistantVisible);
  const dismissAssistantMessage = useNychIQStore((s) => s.dismissAssistantMessage);

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<{ id: string; content: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Find the first non-dismissed message ── */
  const activeMessage = currentMessage ?? (() => {
    const msg = assistantMessages.find((m) => !m.dismissed);
    return msg ? { id: msg.id, content: msg.content } : null;
  })();

  /* ── Handle hydration ── */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* ── Trigger typing when a message is available ── */
  useEffect(() => {
    if (!mounted || !assistantVisible) return;
    const msg = assistantMessages.find((m) => !m.dismissed);
    if (!msg) return;
    if (currentMessage && currentMessage.id === msg.id) return; // already typing/showing this one

    setCurrentMessage({ id: msg.id, content: msg.content });
    setDisplayedText('');
    setIsTyping(true);
    setIsExiting(false);

    let charIndex = 0;
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);

    typingIntervalRef.current = setInterval(() => {
      charIndex++;
      if (charIndex <= msg.content.length) {
        setDisplayedText(msg.content.slice(0, charIndex));
      } else {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        setIsTyping(false);
        // Auto-dismiss after delay
        autoDismissRef.current = setTimeout(() => {
          setIsExiting(true);
        }, AUTO_DISMISS_DELAY);
      }
    }, TYPING_SPEED);

    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    };
  }, [mounted, assistantVisible, assistantMessages]);

  /* ── Dismiss handler ── */
  const handleDismiss = useCallback(() => {
    if (currentMessage) {
      dismissAssistantMessage(currentMessage.id);
    }
    setIsExiting(true);
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
  }, [currentMessage, dismissAssistantMessage]);

  /* ── After exit animation, hide ── */
  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        setAssistantVisible(false);
        setCurrentMessage(null);
        setDisplayedText('');
        setIsExiting(false);
      }, 400); // match exit animation duration
      return () => clearTimeout(timer);
    }
  }, [isExiting, setAssistantVisible]);

  /* ── Guard: nothing to show ── */
  if (!mounted) return null;
  if (!assistantConfig?.isActive) return null;
  if (!assistantVisible) return null;
  if (!activeMessage) return null;

  const CharacterSVG = CHARACTER_COMPONENTS[assistantConfig.character] ?? DogCharacter;
  const characterName = assistantConfig.name || 'Assistant';

  return (
    <>
      {/* Blinking cursor keyframe */}
      <style>{`
        @keyframes nychiq-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* Non-blocking overlay */}
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        <AnimatePresence>
          {!isExiting && (
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto"
              style={{ width: 'min(90vw, 400px)' }}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* ── Speech bubble (appears above character) ── */}
              <div className="relative mb-2 w-full order-1">
                {/* Name label */}
                <div className="text-center mb-2">
                  <span
                    className="inline-block text-sm font-semibold px-3 py-0.5 rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${PURPLE_GLOW}22, ${PURPLE_GLOW}44)`,
                      color: PURPLE_GLOW,
                      border: `1px solid ${PURPLE_GLOW}55`,
                    }}
                  >
                    {characterName} says:
                  </span>
                </div>

                {/* Bubble card */}
                <div className="relative bg-white rounded-2xl shadow-2xl shadow-black/40 px-5 py-4 mx-4">
                  {/* Bubble pointer (pointing down towards character mouth) */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                    <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                      <path d="M0 0 L10 12 L20 0 Z" fill="white" />
                    </svg>
                  </div>

                  {/* Dismiss button */}
                  <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700"
                    aria-label="Dismiss message"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Typing text */}
                  <p className="text-sm leading-relaxed text-gray-800 pr-6 min-h-[2.5em]">
                    {displayedText}
                    {isTyping && <TypingCursor />}
                  </p>
                </div>
              </div>

              {/* ── Character (bottom) ── */}
              <div
                className="relative order-2"
                style={{
                  width: '110px',
                  height: '150px',
                }}
              >
                {/* Floating idle animation */}
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    y: [0, -4, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <CharacterSVG />
                </motion.div>

                {/* Purple glow under character */}
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full blur-md"
                  style={{ backgroundColor: PURPLE_GLOW, opacity: 0.35 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
