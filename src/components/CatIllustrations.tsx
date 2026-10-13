import React from 'react';

/**
 * Cute sleeping cat curled up on top of a card/header with floating "zZz"
 */
export const SleepingCatIllustration: React.FC<{ className?: string }> = ({
  className = 'w-28 h-20',
}) => (
  <svg
    viewBox="0 0 160 110"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Soft shadow underneath */}
    <ellipse cx="82" cy="96" rx="58" ry="8" fill="#F2D7EE" opacity="0.65" />

    {/* Floating Zzz */}
    <text
      x="122"
      y="34"
      fill="#9D8DF1"
      fontSize="14"
      fontWeight="700"
      fontFamily="Fredoka, Quicksand, sans-serif"
    >
      z
    </text>
    <text
      x="133"
      y="24"
      fill="#7EC8E3"
      fontSize="17"
      fontWeight="700"
      fontFamily="Fredoka, Quicksand, sans-serif"
    >
      Z
    </text>
    <text
      x="146"
      y="14"
      fill="#F4A7B9"
      fontSize="13"
      fontWeight="700"
      fontFamily="Fredoka, Quicksand, sans-serif"
    >
      z
    </text>

    {/* Curled Tail */}
    <path
      d="M32 82C16 82 12 65 24 58C32 53 38 62 34 70"
      stroke="#4A4453"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="#FFFDF9"
    />
    {/* Orange/Peach Calico Spot on Tail */}
    <path
      d="M19 63C23 58 30 58 32 64"
      stroke="#FFD1B3"
      strokeWidth="5"
      strokeLinecap="round"
    />

    {/* Cat Body */}
    <path
      d="M32 86C28 60 50 44 82 46C110 48 128 64 126 86C125 93 116 95 80 95C44 95 34 93 32 86Z"
      fill="#FFFDF9"
      stroke="#4A4453"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />

    {/* Pastel Lavender & Peach Spots on Body */}
    <path
      d="M55 49C65 46 77 47 82 56C74 63 60 61 55 49Z"
      fill="#E5DEFF"
    />
    <path
      d="M40 62C46 56 54 60 52 69C46 72 39 68 40 62Z"
      fill="#FFD6E0"
    />

    {/* Cat Head */}
    <circle
      cx="104"
      cy="68"
      r="24"
      fill="#FFFDF9"
      stroke="#4A4453"
      strokeWidth="3.5"
    />

    {/* Left Ear */}
    <path
      d="M84 54L80 35L98 45"
      fill="#FFFDF9"
      stroke="#4A4453"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <path d="M85 50L83 39L94 45" fill="#FFC6D0" />

    {/* Right Ear */}
    <path
      d="M114 46L126 34L127 54"
      fill="#FFFDF9"
      stroke="#4A4453"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <path d="M116 47L124 39L124 51" fill="#FFC6D0" />

    {/* Closed Peaceful Eyes */}
    <path
      d="M92 68C94 72 99 72 101 68"
      stroke="#4A4453"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <path
      d="M111 68C113 72 118 72 120 68"
      stroke="#4A4453"
      strokeWidth="3"
      strokeLinecap="round"
    />

    {/* Rosy Cheeks */}
    <ellipse cx="89" cy="73" rx="4.5" ry="2.8" fill="#FFB3C6" />
    <ellipse cx="122" cy="73" rx="4.5" ry="2.8" fill="#FFB3C6" />

    {/* Cute Little Mouth (w) */}
    <path
      d="M102 74C103.5 76.5 106 76.5 106 74C106 76.5 108.5 76.5 110 74"
      stroke="#4A4453"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Little Front Paws Tucked In */}
    <ellipse
      cx="78"
      cy="92"
      rx="9"
      ry="5.5"
      fill="#FFFDF9"
      stroke="#4A4453"
      strokeWidth="3"
    />
    <ellipse
      cx="115"
      cy="92"
      rx="9"
      ry="5.5"
      fill="#FFFDF9"
      stroke="#4A4453"
      strokeWidth="3"
    />
  </svg>
);

/**
 * Cute study cat wearing round glasses and holding a book/pencil for empty states & headers
 */
export const StudyCatIllustration: React.FC<{ className?: string }> = ({
  className = 'w-32 h-32',
}) => (
  <svg
    viewBox="0 0 160 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Background Pastel Circle */}
    <circle cx="80" cy="78" r="58" fill="#E8F4F8" />
    <circle
      cx="80"
      cy="78"
      r="58"
      stroke="#BDE0FE"
      strokeWidth="3"
      strokeDasharray="6 6"
    />

    {/* Floating Sparkle Stars */}
    <path
      d="M30 36L33 42L39 45L33 48L30 54L27 48L21 45L27 42L30 36Z"
      fill="#FFE599"
    />
    <path
      d="M132 32L134 36L138 38L134 40L132 44L130 40L126 38L130 36L132 32Z"
      fill="#FFC6D0"
    />

    {/* Cat Ears */}
    <path
      d="M48 64L42 32L70 48"
      fill="#FFFDF9"
      stroke="#4A4453"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <path d="M50 58L46 39L64 49" fill="#FFC6D0" />

    <path
      d="M112 64L118 32L90 48"
      fill="#FFFDF9"
      stroke="#4A4453"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <path d="M110 58L114 39L96 49" fill="#FFC6D0" />

    {/* Cat Head & Upper Body */}
    <path
      d="M44 82C44 57 58 45 80 45C102 45 116 57 116 82V114H44V82Z"
      fill="#FFFDF9"
      stroke="#4A4453"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />

    {/* Pastel Mint Graduation/Study Beret */}
    <ellipse
      cx="80"
      cy="44"
      rx="24"
      ry="8"
      fill="#C8F2E0"
      stroke="#4A4453"
      strokeWidth="3"
    />
    <path
      d="M78 36C80 32 84 32 85 36"
      stroke="#4A4453"
      strokeWidth="3"
      strokeLinecap="round"
    />

    {/* Cute Round Glasses */}
    <circle
      cx="65"
      cy="74"
      r="11"
      fill="#FFFFFF"
      fillOpacity="0.8"
      stroke="#4A4453"
      strokeWidth="3"
    />
    <circle
      cx="95"
      cy="74"
      r="11"
      fill="#FFFFFF"
      fillOpacity="0.8"
      stroke="#4A4453"
      strokeWidth="3"
    />
    <path d="M76 74H84" stroke="#4A4453" strokeWidth="3" />

    {/* Eyes */}
    <circle cx="65" cy="74" r="3.5" fill="#4A4453" />
    <circle cx="66.2" cy="72.8" r="1.2" fill="#FFFFFF" />
    <circle cx="95" cy="74" r="3.5" fill="#4A4453" />
    <circle cx="96.2" cy="72.8" r="1.2" fill="#FFFFFF" />

    {/* Rosy Cheeks */}
    <ellipse cx="52" cy="82" rx="5" ry="3" fill="#FFB3C6" />
    <ellipse cx="108" cy="82" rx="5" ry="3" fill="#FFB3C6" />

    {/* Nose & Smile */}
    <polygon points="77,80 83,80 80,84" fill="#F4A7B9" />
    <path
      d="M75 86C77 89 80 89 80 86C80 89 83 89 85 86"
      stroke="#4A4453"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Open Pastel Lavender Notebook at Bottom */}
    <path
      d="M36 106L80 114L124 106V132L80 140L36 132V106Z"
      fill="#E5DEFF"
      stroke="#4A4453"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <path d="M80 114V140" stroke="#4A4453" strokeWidth="3.5" />

    {/* Cat Paws Holding the Book */}
    <ellipse
      cx="52"
      cy="108"
      rx="9"
      ry="6"
      fill="#FFFDF9"
      stroke="#4A4453"
      strokeWidth="3"
    />
    <ellipse
      cx="108"
      cy="108"
      rx="9"
      ry="6"
      fill="#FFFDF9"
      stroke="#4A4453"
      strokeWidth="3"
    />
  </svg>
);

/**
 * Cute small cat face badge for logo & decorative headers
 */
export const CuteCatBadge: React.FC<{ className?: string }> = ({
  className = 'w-9 h-9',
}) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle
      cx="32"
      cy="32"
      r="29"
      fill="#E5DEFF"
      stroke="#4A4453"
      strokeWidth="3"
    />
    {/* Ears */}
    <path
      d="M15 28L12 13L26 20"
      fill="#FFFDF9"
      stroke="#4A4453"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path d="M16 24L14 16L22 20" fill="#FFB3C6" />
    <path
      d="M49 28L52 13L38 20"
      fill="#FFFDF9"
      stroke="#4A4453"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path d="M48 24L50 16L42 20" fill="#FFB3C6" />

    {/* Head */}
    <ellipse
      cx="32"
      cy="35"
      rx="19"
      ry="16"
      fill="#FFFDF9"
      stroke="#4A4453"
      strokeWidth="3"
    />

    {/* Eyes */}
    <circle cx="24" cy="34" r="2.8" fill="#4A4453" />
    <circle cx="40" cy="34" r="2.8" fill="#4A4453" />

    {/* Blush */}
    <ellipse cx="19" cy="38" rx="3.5" ry="2" fill="#FFB3C6" />
    <ellipse cx="45" cy="38" rx="3.5" ry="2" fill="#FFB3C6" />

    {/* Mouth */}
    <path
      d="M28 38C29.5 40.5 32 40.5 32 38C32 40.5 34.5 40.5 36 38"
      stroke="#4A4453"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Cute paw print icon
 */
export const PawPrintIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <circle cx="7" cy="7.5" r="2.2" />
    <circle cx="12" cy="5.5" r="2.2" />
    <circle cx="17" cy="7.5" r="2.2" />
    <path d="M12 10.5C8.8 10.5 6.5 13 6.5 16C6.5 18.2 8.3 19.5 10.2 19.5C11 19.5 11.5 19.2 12 19.2C12.5 19.2 13 19.5 13.8 19.5C15.7 19.5 17.5 18.2 17.5 16C17.5 13 15.2 10.5 12 10.5Z" />
  </svg>
);
