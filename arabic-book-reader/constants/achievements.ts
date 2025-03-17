// Achievement-related constants for the app

// Islamic wisdom quotes for motivation
export const wisdomQuotes = [
  "Whoever sends blessings on me once, Allah will send blessings on him tenfold. - Prophet Muhammad ﷺ",
  "The closest of people to me on the Day of Resurrection will be those who send the most blessings upon me. - Prophet Muhammad ﷺ",
  "Sending blessings upon me will be a light on the bridge (Sirat). - Prophet Muhammad ﷺ",
  "Do not make your houses graves, and do not make my grave a place of celebration. Send blessings upon me, for your blessings reach me wherever you are. - Prophet Muhammad ﷺ",
  "The miser is the one in whose presence I am mentioned, and he does not send blessings upon me. - Prophet Muhammad ﷺ",
  "Send abundant blessings on me on Friday, for it is witnessed (by the angels). - Prophet Muhammad ﷺ",
  "The supplication is suspended between heaven and earth and none of it is taken up until you send blessings upon your Prophet. - Prophet Muhammad ﷺ",
  "When you hear the Mu'adhdhin, repeat what he says, then send blessings on me. - Prophet Muhammad ﷺ",
  "Send blessings upon me, for indeed your blessings will reach me from wherever you are. - Prophet Muhammad ﷺ",
  "Whoever sends blessings upon me once, Allah will send blessings upon him tenfold and erase ten sins and raise him ten degrees in status. - Prophet Muhammad ﷺ",
  "When you hear the Mu'adhdhin, repeat what he says, then invoke a blessing on me, for everyone who invokes a blessing on me will receive ten blessings from Allah. - Prophet Muhammad ﷺ",
  "Among the most excellent of your days is Friday; so invoke many blessings on me on that day, for your blessing will be submitted to me. - Prophet Muhammad ﷺ",
  "Allah has prohibited the earth from consuming the bodies of the Prophets. - Prophet Muhammad ﷺ",
  "Whenever someone greets me (with salam), Allah returns the soul to my body (in the grave) and I return his greeting. - Prophet Muhammad ﷺ",
  "The closest of people to me on the Day of Resurrection will be those who sent the most blessings upon me. - Prophet Muhammad ﷺ",
  "Du'ā' (supplication) is suspended between heaven and earth and none of it is taken up until you send blessings upon your Prophet. - Prophet Muhammad ﷺ",
  "If you make all of your du'ā' sending blessings upon me, then your concerns will be taken care of and your sins will be forgiven. - Prophet Muhammad ﷺ",
];

// Khatm-specific congratulatory messages
export const khatmMessages = [
  "SubhanAllah! You've completed your goal of sending blessings on the Prophet ﷺ. May Allah accept this noble deed from you.",
  "Allahu Akbar! Your dedication to sending salawat has led you to this achievement. May Allah bless you.",
  "Alhamdulillah for this blessed completion! May the Prophet ﷺ intercede for you on the Day of Judgment.",
  "MashaAllah! You've journeyed through sending countless blessings. May this completion be a light for you in this world and the next.",
  "Congratulations! Your love for the Prophet ﷺ shines through your dedication. May you be among those closest to him on the Day of Resurrection.",
  "Amazing achievement! Remember the Prophet ﷺ said: 'The closest of people to me on the Day of Resurrection will be those who sent the most blessings upon me.'",
  "Blessed completion! Your salawat are a source of light on the bridge (Sirat) on the Day of Judgment.",
];

// Achievement badges with levels
export const achievementLevels = {
  streaks: ["Consistent Reciter", "Dedicated Reciter", "Steadfast Companion", "Exemplary Follower", "Lover of Salawat"],
  completions: ["Beginner", "Explorer", "Devoted", "Master", "Muhammadi"],
  khatms: ["First Completion", "Devoted Follower", "Salawat Companion", "Lover of the Prophet ﷺ", "Distinguished Reciter"]
};

// Badge icons for different achievement types
export const getBadgeIcon = (type: 'khatm' | 'streak' | 'manzil', level = 0): string => {
  const badges = {
    khatm: ["🌙", "✨", "🏆", "👑", "🌟"],
    streak: ["🔥", "⚡", "🌊", "🏔️", "⭐"],
    manzil: ["📖", "📚", "🧠", "💫", "🌈"],
  };
  return badges[type][Math.min(level, 4)];
}; 