import type { LocaleId } from "./locales";

/** Flat UI dictionary — keys shared across locales. */
export type MessageKey =
  | "crystals_count"
  | "play"
  | "level_n"
  | "endless_n"
  | "daily"
  | "daily_done"
  | "daily_layout"
  | "streak_aria"
  | "duel"
  | "duel_detail"
  | "duel_kicker"
  | "duel_footer"
  | "duel_couch"
  | "duel_couch_detail"
  | "duel_couch_tag"
  | "duel_online"
  | "duel_online_detail"
  | "duel_online_tag"
  | "duel_online_kicker"
  | "duel_online_intro"
  | "duel_create"
  | "duel_join"
  | "duel_code_friend"
  | "duel_room_code"
  | "duel_waiting"
  | "duel_connected_host"
  | "duel_connected_guest"
  | "duel_connecting"
  | "duel_start"
  | "duel_draw"
  | "duel_draw_detail"
  | "duel_win"
  | "duel_win_detail"
  | "duel_rival"
  | "duel_rival_detail"
  | "duel_again"
  | "duel_end"
  | "duel_error"
  | "duel_error_open"
  | "duel_error_find"
  | "duel_code_needed"
  | "modes"
  | "modes_detail"
  | "levels"
  | "album"
  | "shop"
  | "how_to_play"
  | "mute_on"
  | "mute_off"
  | "settings"
  | "settings_kicker"
  | "sound"
  | "sound_on"
  | "sound_off"
  | "haptics"
  | "haptics_on"
  | "haptics_off"
  | "language"
  | "language_auto"
  | "language_system"
  | "duel_settings_detail"
  | "tutorial_again"
  | "reset_progress"
  | "reset_detail"
  | "reset_confirm"
  | "reset_confirm_detail"
  | "reset_ask_title"
  | "reset_ask_body"
  | "reset_yes"
  | "reset_no"
  | "confirm_cancel"
  | "back_menu"
  | "modes_kicker"
  | "modes_footer"
  | "mode_rush"
  | "mode_rush_detail"
  | "mode_rush_tag"
  | "mode_rush_best"
  | "mode_master"
  | "mode_master_detail"
  | "mode_master_tag"
  | "mode_master_progress"
  | "mode_master_best"
  | "mode_echo"
  | "mode_echo_detail"
  | "mode_echo_tag"
  | "mode_echo_progress"
  | "mode_echo_best"
  | "mode_continue"
  | "rush_over"
  | "rush_again"
  | "menu"
  | "layouts_row"
  | "album_kicker"
  | "album_hint"
  | "album_preview_hint"
  | "album_close"
  | "level_word"
  | "levels_title"
  | "levels_kicker_empty"
  | "levels_kicker_progress"
  | "map_path"
  | "map_realm_locked"
  | "map_constellation"
  | "map_continue"
  | "map_here"
  | "map_chapter"
  | "realm_dusk"
  | "realm_dusk_detail"
  | "realm_nebula"
  | "realm_nebula_detail"
  | "realm_glacier"
  | "realm_glacier_detail"
  | "realm_ember"
  | "realm_ember_detail"
  | "realm_garden"
  | "realm_garden_detail"
  | "endless"
  | "endless_record"
  | "endless_unlocked"
  | "endless_locked"
  | "shop_title"
  | "shop_earn"
  | "shop_watch_ad"
  | "shop_ad_ready"
  | "shop_ad_wait"
  | "shop_themes"
  | "shop_shapes"
  | "shop_sounds"
  | "shop_effects"
  | "shop_packs"
  | "shop_support"
  | "shop_active"
  | "shop_unlocked"
  | "shop_active_board"
  | "shop_active_sound"
  | "trail"
  | "trail_none"
  | "trail_none_detail"
  | "remove_ads"
  | "remove_ads_detail"
  | "remove_ads_owned"
  | "premium_unlocked"
  | "pack_small"
  | "pack_medium"
  | "pack_large"
  | "pack_small_detail"
  | "pack_medium_detail"
  | "pack_large_detail"
  | "need_crystals"
  | "theme_unlocked"
  | "shape_unlocked"
  | "sound_unlocked"
  | "trail_unlocked"
  | "pack_claimed"
  | "ad_reward"
  | "ad_wait"
  | "daily_already"
  | "daily_reward"
  | "daily_streak_reward"
  | "album_unlock"
  | "progress_reset"
  | "daily_reminder"
  | "daily_reminder_on"
  | "daily_reminder_off"
  | "daily_reminder_denied"
  | "daily_reminder_unsupported"
  | "daily_reminder_prompt"
  | "daily_reminder_title"
  | "daily_reminder_body"
  | "account_google"
  | "account_google_detail"
  | "account_google_signin"
  | "account_google_signout"
  | "account_google_signed"
  | "account_google_missing"
  | "account_google_error"
  | "payments_soon"
  | "constellation_intro_kicker"
  | "constellation_intro_title"
  | "constellation_intro_body"
  | "constellation_intro_ok"
  | "kind_animal"
  | "kind_plant"
  | "kind_object"
  | "learn"
  | "theme_from_start"
  | "unlock_or_buy"
  | "hud_time"
  | "hud_streak"
  | "hud_crossings"
  | "hud_moves"
  | "hud_pairs"
  | "hud_min_moves"
  | "hint_echo"
  | "hint_magnet"
  | "hint_untangle"
  | "cleared_default"
  | "board_aria"
  | "canvas_error"
  | "album_found_meta"
  | "album_locked_meta"
  | "quest_kicker"
  | "quest_claim"
  | "quest_done"
  | "quest_path_done"
  | "quest_progress"
  | "quest_reward"
  | "quest_q1_title"
  | "quest_q1_detail"
  | "quest_q2_title"
  | "quest_q2_detail"
  | "quest_q3_title"
  | "quest_q3_detail"
  | "quest_q4_title"
  | "quest_q4_detail"
  | "quest_q5_title"
  | "quest_q5_detail"
  | "quest_q6_title"
  | "quest_q6_detail"
  | "quest_q7_title"
  | "quest_q7_detail"
  | "quest_q8_title"
  | "quest_q8_detail"
  | "quest_q9_title"
  | "quest_q9_detail"
  | "quest_q10_title"
  | "quest_q10_detail"
  | "quest_q11_title"
  | "quest_q11_detail"
  | "quest_q12_title"
  | "quest_q12_detail"
  | "quest_q13_title"
  | "quest_q13_detail"
  | "quest_q14_title"
  | "quest_q14_detail"
  | "quest_q15_title"
  | "quest_q15_detail"
  | "quest_q16_title"
  | "quest_q16_detail"
  | "quest_q17_title"
  | "quest_q17_detail"
  | "quest_q18_title"
  | "quest_q18_detail"
  | "quest_q19_title"
  | "quest_q19_detail"
  | "quest_q20_title"
  | "quest_q20_detail"
  | "quest_q21_title"
  | "quest_q21_detail"
  | "quest_q22_title"
  | "quest_q22_detail"
  | "quest_q23_title"
  | "quest_q23_detail"
  | "quest_q24_title"
  | "quest_q24_detail"
  | "quest_q25_title"
  | "quest_q25_detail"
  | "tutorial_title"
  | "tutorial_skip"
  | "tutorial_next"
  | "tutorial_back"
  | "tutorial_hint"
  | "tutorial_line_grab"
  | "tutorial_line_drop"
  | "tutorial_line_hold"
  | "tutorial_line_white"
  | "tutorial_line_solved"
  | "tutorial_aria"
  | "howto_kicker"
  | "howto_practice"
  | "howto_to_menu"
  | "howto_core_title"
  | "howto_core_detail"
  | "howto_core_tag"
  | "howto_campaign_title"
  | "howto_campaign_detail"
  | "howto_campaign_tag"
  | "howto_rush_title"
  | "howto_rush_detail"
  | "howto_rush_tag"
  | "howto_master_title"
  | "howto_master_detail"
  | "howto_master_tag"
  | "howto_echo_title"
  | "howto_echo_detail"
  | "howto_echo_tag"
  | "howto_daily_title"
  | "howto_daily_detail"
  | "howto_daily_tag"
  | "howto_duel_title"
  | "howto_duel_detail"
  | "howto_duel_tag";

type Dict = Record<MessageKey, string>;

const en: Dict = {
  crystals_count: "{n} crystals",
  play: "Play",
  level_n: "Level {n}",
  endless_n: "Endless {n}",
  daily: "Daily",
  daily_done: "Cleared today",
  daily_layout: "Daily layout · +{n}",
  streak_aria: "Streak {n} days",
  duel: "Duel",
  duel_detail: "Couch or code",
  duel_kicker: "Same layout · first clear wins",
  duel_footer: "One phone face-to-face · or a room code online",
  duel_couch: "One phone",
  duel_couch_detail: "Split screen · sit across from each other",
  duel_couch_tag: "Couch",
  duel_online: "Two phones",
  duel_online_detail: "Share a room code · race live",
  duel_online_tag: "Online",
  duel_online_kicker: "Two phones",
  duel_online_intro: "Host a room or enter a friend’s code. No account needed.",
  duel_create: "Create room",
  duel_join: "Join",
  duel_code_friend: "Friend’s code",
  duel_room_code: "Room code",
  duel_waiting: "Waiting for rival…",
  duel_connected_host: "Connected. Starting soon…",
  duel_connected_guest: "Connected. Waiting for start…",
  duel_connecting: "Connecting…",
  duel_start: "Start",
  duel_draw: "Draw",
  duel_draw_detail: "Almost together — beautiful.",
  duel_win: "You win",
  duel_win_detail: "Clean strings first — well played.",
  duel_rival: "Rival wins",
  duel_rival_detail: "Great round. The next one can be yours.",
  duel_again: "Again",
  duel_end: "Ended",
  duel_error: "Error",
  duel_error_open: "Couldn’t open the room.",
  duel_error_find: "Room not found.",
  duel_code_needed: "Enter the code from your friend.",
  modes: "Modes",
  modes_detail: "Lightning · Echo",
  levels: "Levels",
  album: "Album",
  shop: "Shop",
  how_to_play: "How to play",
  mute_on: "Unmute",
  mute_off: "Mute",
  settings: "Settings",
  settings_kicker: "Sound & progress",
  sound: "Sound",
  sound_on: "Harp on",
  sound_off: "Silent",
  haptics: "Haptics",
  haptics_on: "On crystal grab",
  haptics_off: "Off",
  language: "Language",
  language_auto: "System ({name})",
  language_system: "System",
  duel_settings_detail: "Race on two phones",
  tutorial_again: "Show again",
  reset_progress: "Reset progress",
  reset_detail: "Levels & album from scratch · premium and account stay",
  reset_confirm: "Really clear?",
  reset_confirm_detail: "Tap again — start from level 1 · purchases kept",
  reset_ask_title: "Clear all progress?",
  reset_ask_body: "Campaign, album, and mode runs reset. Premium, account, and purchases stay.",
  reset_yes: "Yes, clear everything",
  reset_no: "Keep my progress",
  confirm_cancel: "Cancel",
  back_menu: "Back to menu",
  modes_kicker: "Play variants",
  modes_footer: "Master & Echo save progress · crystals for every clear",
  mode_rush: "Lightning",
  mode_rush_detail: "15 s · each clear +4 s · crystals at the finish",
  mode_rush_tag: "Tempo",
  mode_rush_best: "Best: {n}",
  mode_master: "Master",
  mode_master_detail: "Own layouts, steadily harder · stay inside the move limit · crystals",
  mode_master_tag: "Precision",
  mode_master_progress: "Difficulty {n} · best {best}",
  mode_master_best: "Best difficulty: {n}",
  mode_echo: "Echo",
  mode_echo_detail: "Hidden strings · same weight, a new layout each time · crystals",
  mode_echo_tag: "Senses",
  mode_echo_progress: "Layout {n} · best {best}",
  mode_echo_best: "Best streak: {n}",
  mode_continue: "Continue",
  rush_over: "Run over",
  rush_again: "Again",
  menu: "Menu",
  layouts_row: "layouts in a row",
  album_kicker: "{n} / {total} constellations",
  album_hint: "Tap an unlocked figure to preview",
  album_preview_hint: "Assemble this outline on the board — crystals snap into light wells.",
  album_close: "Close",
  level_word: "Level",
  levels_title: "Journey",
  levels_kicker_empty: "Five lands · one path",
  levels_kicker_progress: "{n} / {total} cleared",
  map_path: "Path",
  map_realm_locked: "Reach level {n}",
  map_constellation: "Figure",
  map_continue: "Continue",
  map_here: "You are here",
  map_chapter: "Chapter {n}",
  realm_dusk: "Dusk Shore",
  realm_dusk_detail: "First knots · soft twilight",
  realm_nebula: "Nebula Veil",
  realm_nebula_detail: "Denser strings · violet mist",
  realm_glacier: "Glacier Pass",
  realm_glacier_detail: "Cold light · sharper crossings",
  realm_ember: "Ember Ridge",
  realm_ember_detail: "Hot tension · long pulls",
  realm_garden: "Garden Gate",
  realm_garden_detail: "Final folds · quiet bloom",
  endless: "Endless",
  endless_record: "Record: level {n}",
  endless_unlocked: "After campaign · no end",
  endless_locked: "After level {n}",
  shop_title: "Shop",
  shop_earn: "Earn",
  shop_watch_ad: "Watch an ad",
  shop_ad_ready: "+{n} crystals",
  shop_ad_wait: "Available soon",
  shop_themes: "Themes",
  shop_shapes: "Crystals",
  shop_sounds: "Sounds",
  shop_effects: "Effects",
  shop_packs: "Crystal packs",
  shop_support: "Support",
  shop_active: "Active",
  shop_unlocked: "Unlocked",
  shop_active_board: "Active on board",
  shop_active_sound: "Active",
  trail: "Light trail",
  trail_none: "No trail",
  trail_none_detail: "Crystal moves without a wake",
  remove_ads: "Unlock everything & remove ads",
  remove_ads_detail: "Themes, shapes, sounds, trail — one-time {price}",
  remove_ads_owned: "Everything unlocked · ads removed",
  premium_unlocked: "Everything unlocked · ads removed",
  pack_small: "Small pack",
  pack_medium: "Medium pack",
  pack_large: "Large pack",
  pack_small_detail: "Quick boost",
  pack_medium_detail: "Most popular",
  pack_large_detail: "Shop stockpile",
  need_crystals: "You need {n} crystals",
  theme_unlocked: "Theme unlocked",
  shape_unlocked: "Shape unlocked",
  sound_unlocked: "Sound unlocked",
  trail_unlocked: "Trail unlocked",
  pack_claimed: "+{n} crystals · {name}",
  ad_reward: "+{n} crystals (ad placeholder)",
  ad_wait: "Wait a moment for the next reward",
  daily_already: "Daily already cleared today",
  daily_reward: "Daily! +{n} crystals",
  daily_streak_reward: "Daily · streak {n} · +{crystals}",
  album_unlock: "Album: {name} · +{n}",
  progress_reset: "Progress cleared · level 1 · premium kept",
  daily_reminder: "Daily reminder",
  daily_reminder_on: "On · around 10:00",
  daily_reminder_off: "Off · tap to enable",
  daily_reminder_denied: "Notifications blocked in system settings",
  daily_reminder_unsupported: "Notifications unavailable here",
  daily_reminder_prompt: "Remind you about Daily each morning?",
  daily_reminder_title: "Daily is waiting",
  daily_reminder_body: "A new tangle is ready · open Tangle Duel",
  account_google: "Google account",
  account_google_detail: "Link progress · Play / cloud ready",
  account_google_signin: "Sign in with Google",
  account_google_signout: "Sign out",
  account_google_signed: "Signed in as {name}",
  account_google_missing: "Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable login",
  account_google_error: "Could not sign in · try again",
  payments_soon: "Payments coming soon",
  constellation_intro_kicker: "Constellation",
  constellation_intro_title: "Assemble the star figure",
  constellation_intro_body:
    "Every 6 levels an outline appears — animals, plants, and objects from the album. Pull crystals into the light wells until the strings form the figure. First discovery goes to the Album.",
  constellation_intro_ok: "Got it",
  kind_animal: "Animal",
  kind_plant: "Plant",
  kind_object: "Object",
  learn: "Learn",
  theme_from_start: "From the start",
  unlock_or_buy: "{req} · or {price}",
  hud_time: "Time",
  hud_streak: "Streak",
  hud_crossings: "Crossings",
  hud_moves: "Moves",
  hud_pairs: "Pairs",
  hud_min_moves: "Min moves",
  hint_echo: "Touch a crystal — sonar briefly shows strings and crossings.",
  hint_magnet: "Any crystal snaps into a free light well — fill the outline, no crossings.",
  hint_untangle: "Drag crystals inside the circle until the strings stop crossing.",
  cleared_default: "Untangled",
  board_aria: "Tangle Duel board. Drag crystals to untangle the strings.",
  canvas_error: "This browser did not provide a canvas. Open the game in current Safari or Chrome.",
  album_found_meta: "{kind} · lv. {n}",
  album_locked_meta: "Level {n}",
  quest_kicker: "Quest",
  quest_claim: "Claim +{n}",
  quest_done: "Path complete",
  quest_path_done: "All quests claimed",
  quest_progress: "{n} / {total}",
  quest_reward: "+{n}",
  quest_q1_title: "First knots",
  quest_q1_detail: "Clear 3 campaign levels",
  quest_q2_title: "Daylight string",
  quest_q2_detail: "Claim today's Daily",
  quest_q3_title: "Flash hands",
  quest_q3_detail: "Clear 5 layouts in Rush (total)",
  quest_q4_title: "Star figure",
  quest_q4_detail: "Reveal 1 constellation",
  quest_q5_title: "Steady path",
  quest_q5_detail: "Clear 10 campaign levels",
  quest_q6_title: "Rival thread",
  quest_q6_detail: "Create a room for a friend — or play couch on one phone",
  quest_q7_title: "Far shore",
  quest_q7_detail: "Reach campaign level 20",
  quest_q8_title: "Rush sum",
  quest_q8_detail: "Clear 15 Rush layouts in total (all runs)",
  quest_q9_title: "First streak",
  quest_q9_detail: "Reach a Rush record of 5 in one run",
  quest_q10_title: "Longer path",
  quest_q10_detail: "Clear 25 campaign levels",
  quest_q11_title: "Double digits",
  quest_q11_detail: "Reach a Rush record of 10 in one run",
  quest_q12_title: "Sky album",
  quest_q12_detail: "Reveal 3 constellations",
  quest_q13_title: "Master steps",
  quest_q13_detail: "Reach Master difficulty 5",
  quest_q14_title: "Dusk complete",
  quest_q14_detail: "Reach campaign level 36",
  quest_q15_title: "Rush fifteen",
  quest_q15_detail: "Reach a Rush record of 15 in one run",
  quest_q16_title: "Echo glow",
  quest_q16_detail: "Clear 5 Echo layouts (best streak)",
  quest_q17_title: "Storm hours",
  quest_q17_detail: "Clear 40 Rush layouts in total",
  quest_q18_title: "Halfway knots",
  quest_q18_detail: "Clear 50 campaign levels",
  quest_q19_title: "Six figures",
  quest_q19_detail: "Reveal 6 constellations",
  quest_q20_title: "Rush twenty",
  quest_q20_detail: "Reach a Rush record of 20 in one run",
  quest_q21_title: "Nebula gate",
  quest_q21_detail: "Reach campaign level 72",
  quest_q22_title: "Master twelve",
  quest_q22_detail: "Reach Master difficulty 12",
  quest_q23_title: "Century clear",
  quest_q23_detail: "Clear 100 campaign levels",
  quest_q24_title: "Rush flood",
  quest_q24_detail: "Clear 80 Rush layouts in total",
  quest_q25_title: "Journey's end",
  quest_q25_detail: "Reach campaign level 180",
  tutorial_title: "Tutorial",
  tutorial_skip: "Skip",
  tutorial_next: "Next",
  tutorial_back: "Back",
  tutorial_hint: "Warm string = crossing. Bright string = free.",
  tutorial_line_grab: "Grab the crystal in the orange ring → drag to the bright point in open space.",
  tutorial_line_drop: "Release on the bright point.",
  tutorial_line_hold: "Hold the layout with no crossings.",
  tutorial_line_white: "Release when the string turns bright.",
  tutorial_line_solved: "Yes. Nothing crosses.",
  tutorial_aria: "Tutorial. Drag the ringed crystal to the bright point until strings stop crossing.",
  howto_kicker: "Rules & modes",
  howto_practice: "Practice gesture",
  howto_to_menu: "To menu",
  howto_core_title: "The core",
  howto_core_detail: "Drag crystals in the circle. Warm = crossing, bright = free. Hold 3 s clear to finish.",
  howto_core_tag: "Basics",
  howto_campaign_title: "Journey",
  howto_campaign_detail: "Levels through five lands. Every 6th level reveals a constellation for the album.",
  howto_campaign_tag: "Campaign",
  howto_rush_title: "Rush",
  howto_rush_detail: "Timed runs. Each clear adds time. Chase your best streak.",
  howto_rush_tag: "Modes",
  howto_master_title: "Master",
  howto_master_detail: "Your own nodes, limited moves, rising difficulty.",
  howto_master_tag: "Modes",
  howto_echo_title: "Echo",
  howto_echo_detail: "Strings stay hidden. Touch a crystal for a brief sonar flash.",
  howto_echo_tag: "Modes",
  howto_daily_title: "Daily",
  howto_daily_detail: "One shared layout each day. Streak and crystals for the claim.",
  howto_daily_tag: "Challenge",
  howto_duel_title: "Duel",
  howto_duel_detail: "Couch split-screen or a room code on two phones. Same tangle — first clear wins.",
  howto_duel_tag: "1v1",
};

const pl: Dict = {
  ...en,
  crystals_count: "{n} kryształów",
  play: "Graj",
  level_n: "Poziom {n}",
  endless_n: "Nieskończone {n}",
  daily: "Daily",
  daily_done: "Zaliczone dziś",
  daily_layout: "Układ dnia · +{n}",
  streak_aria: "Seria {n} dni",
  duel: "Pojedynek",
  duel_detail: "Kanapa lub kod",
  duel_kicker: "Ten sam układ · kto pierwszy, wygrywa",
  duel_footer: "Jeden telefon naprzeciw siebie · albo kod pokoju online",
  duel_couch: "Jeden telefon",
  duel_couch_detail: "Split screen · naprzeciw siebie",
  duel_couch_tag: "Kanapa",
  duel_online: "Dwa telefony",
  duel_online_detail: "Kod pokoju · wyścig na żywo",
  duel_online_tag: "Online",
  duel_online_kicker: "Dwa telefony",
  duel_online_intro: "Stwórz pokój albo wpisz kod od znajomego. Bez konta.",
  duel_create: "Stwórz pokój",
  duel_join: "Dołącz",
  duel_code_friend: "Kod znajomego",
  duel_room_code: "Kod pokoju",
  duel_waiting: "Czekam na rywala…",
  duel_connected_host: "Połączono. Start zaraz…",
  duel_connected_guest: "Połączono. Czekam na start…",
  duel_connecting: "Łączę…",
  duel_start: "Start",
  duel_draw: "Remis",
  duel_draw_detail: "Prawie równocześnie — pięknie.",
  duel_win: "Wygrywasz",
  duel_win_detail: "Czyste struny pierwsze — brawo.",
  duel_rival: "Wygrywa rywal",
  duel_rival_detail: "Świetna runda. Następna może być Twoja.",
  duel_again: "Jeszcze raz",
  duel_end: "Koniec",
  duel_error: "Błąd",
  duel_error_open: "Nie udało się otworzyć pokoju.",
  duel_error_find: "Nie znaleziono pokoju.",
  duel_code_needed: "Wpisz kod od znajomego.",
  modes: "Tryby",
  modes_detail: "Błyskawica · Echo",
  levels: "Poziomy",
  album: "Album",
  shop: "Sklep",
  how_to_play: "Jak grać",
  mute_on: "Włącz dźwięk",
  mute_off: "Wycisz dźwięk",
  settings: "Ustawienia",
  settings_kicker: "Dźwięk i postęp",
  sound: "Dźwięk",
  sound_on: "Harfa włączona",
  sound_off: "Cisza",
  haptics: "Wibracje",
  haptics_on: "Przy złapaniu kryształu",
  haptics_off: "Wyłączone",
  language: "Język",
  language_auto: "Systemowy ({name})",
  language_system: "Systemowy",
  duel_settings_detail: "Wyścig na dwóch telefonach",
  tutorial_again: "Pokaż jeszcze raz",
  reset_progress: "Resetuj postęp",
  reset_detail: "Poziomy i album od zera · premium i konto zostają",
  reset_confirm: "Na pewno wyczyścić?",
  reset_confirm_detail: "Stuknij jeszcze raz — start od 1 · zakupy zostają",
  reset_ask_title: "Wyczyścić cały postęp?",
  reset_ask_body: "Kampania, album i biegi trybów wrócą do zera. Premium, konto i zakupy zostają.",
  reset_yes: "Tak, wyczyść wszystko",
  reset_no: "Zostaw mój postęp",
  confirm_cancel: "Anuluj",
  back_menu: "Wróć do menu",
  modes_kicker: "Warianty rozgrywki",
  modes_footer: "Mistrz i Echo zapisują postęp · kryształy za każde rozplątanie",
  mode_rush: "Błyskawica",
  mode_rush_detail: "15 s · każde rozplątanie +4 s · kryształy na koniec biegu",
  mode_rush_tag: "Tempo",
  mode_rush_best: "Rekord: {n}",
  mode_master: "Mistrz",
  mode_master_detail: "Własne układy, coraz trudniejsze · limit ruchów · kryształy",
  mode_master_tag: "Precyzja",
  mode_master_progress: "Trudność {n} · rekord {best}",
  mode_master_best: "Rekord trudności: {n}",
  mode_echo: "Echo",
  mode_echo_detail: "Ukryte struny · ta sama waga, nowy układ · kryształy",
  mode_echo_tag: "Zmysły",
  mode_echo_progress: "Układ {n} · rekord {best}",
  mode_echo_best: "Najlepsza seria: {n}",
  mode_continue: "Kontynuuj",
  rush_over: "Koniec biegu",
  rush_again: "Jeszcze raz",
  menu: "Menu",
  layouts_row: "układów z rzędu",
  album_kicker: "{n} / {total} konstelacji",
  album_hint: "Stuknij odblokowaną figurę, by zobaczyć podgląd",
  album_preview_hint: "Złóż ten zarys na planszy — kryształy wpadają w świetlne gniazda.",
  album_close: "Zamknij",
  level_word: "Poziom",
  levels_title: "Podróż",
  levels_kicker_empty: "Pięć krain · jedna ścieżka",
  levels_kicker_progress: "{n} / {total} zaliczonych",
  map_path: "Ścieżka",
  map_realm_locked: "Do poziomu {n}",
  map_constellation: "Figura",
  map_continue: "Kontynuuj",
  map_here: "Tu jesteś",
  map_chapter: "Kraina {n}",
  realm_dusk: "Brzeg Zmierzchu",
  realm_dusk_detail: "Pierwsze węzły · miękki zmrok",
  realm_nebula: "Zasłona Mgławicy",
  realm_nebula_detail: "Gęstsze struny · fioletowa mgła",
  realm_glacier: "Przełęcz Lodowca",
  realm_glacier_detail: "Zimne światło · ostrzejsze przecięcia",
  realm_ember: "Grzbiet Ember",
  realm_ember_detail: "Gorące napięcie · dłuższe ciągi",
  realm_garden: "Brama Ogrodu",
  realm_garden_detail: "Ostatnie fałdy · cichy rozkwit",
  endless: "Nieskończone",
  endless_record: "Rekord: poziom {n}",
  endless_unlocked: "Po kampanii · bez końca",
  endless_locked: "Po poziomie {n}",
  shop_title: "Sklep",
  shop_earn: "Zarabiaj",
  shop_watch_ad: "Obejrzyj reklamę",
  shop_ad_ready: "+{n} kryształów",
  shop_ad_wait: "Zaraz będzie dostępna",
  shop_themes: "Motywy",
  shop_shapes: "Kryształy",
  shop_sounds: "Brzmienia",
  shop_effects: "Efekty",
  shop_packs: "Paczki kryształów",
  shop_support: "Wsparcie",
  shop_active: "Aktywny",
  shop_unlocked: "Odblokowany",
  shop_active_board: "Aktywny na planszy",
  shop_active_sound: "Aktywne",
  trail: "Ślad światła",
  trail_none: "Bez śladu",
  trail_none_detail: "Kryształ bez smugi za ruchem",
  remove_ads: "Odblokuj wszystko i usuń reklamy",
  remove_ads_detail: "Motywy, kształty, brzmienia, ślad — jednorazowo {price}",
  remove_ads_owned: "Wszystko odblokowane · bez reklam",
  premium_unlocked: "Wszystko odblokowane · bez reklam",
  pack_small: "Mała paczka",
  pack_medium: "Średnia paczka",
  pack_large: "Duża paczka",
  pack_small_detail: "Szybki zastrzyk",
  pack_medium_detail: "Najczęściej wybierana",
  pack_large_detail: "Zapas na sklep",
  need_crystals: "Potrzebujesz {n} kryształów",
  theme_unlocked: "Motyw odblokowany",
  shape_unlocked: "Kształt odblokowany",
  sound_unlocked: "Brzmienie odblokowane",
  trail_unlocked: "Ślad odblokowany",
  pack_claimed: "+{n} kryształów · {name}",
  ad_reward: "+{n} kryształów (tu będzie reklama)",
  ad_wait: "Poczekaj chwilę na kolejną nagrodę",
  daily_already: "Daily już zaliczone dziś",
  daily_reward: "Daily! +{n} kryształów",
  daily_streak_reward: "Daily · seria {n} · +{crystals}",
  album_unlock: "Album: {name} · +{n}",
  progress_reset: "Postęp wyczyszczony · poziom 1 · premium zostaje",
  daily_reminder: "Przypomnienie Daily",
  daily_reminder_on: "Włączone · około 10:00",
  daily_reminder_off: "Wyłączone · stuknij, by włączyć",
  daily_reminder_denied: "Powiadomienia zablokowane w systemie",
  daily_reminder_unsupported: "Powiadomienia niedostępne tutaj",
  daily_reminder_prompt: "Przypominać rano o Daily?",
  daily_reminder_title: "Daily czeka",
  daily_reminder_body: "Nowy układ jest gotowy · otwórz Tangle Duel",
  account_google: "Konto Google",
  account_google_detail: "Powiąż postęp · gotowe pod Play",
  account_google_signin: "Zaloguj przez Google",
  account_google_signout: "Wyloguj",
  account_google_signed: "Zalogowano: {name}",
  account_google_missing: "Dodaj NEXT_PUBLIC_GOOGLE_CLIENT_ID, by włączyć logowanie",
  account_google_error: "Nie udało się zalogować · spróbuj ponownie",
  payments_soon: "Płatności wkrótce",
  constellation_intro_kicker: "Konstelacja",
  constellation_intro_title: "Ułóż gwiazdozbiór",
  constellation_intro_body:
    "Co 6 poziomów pojawia się zarys — zwierzęta, rośliny i przedmioty z albumu. Wciągnij kryształy w świetlne gniazda, aż struny złożą figurę. Pierwsze odkrycie trafia do Albumu.",
  constellation_intro_ok: "Rozumiem",
  kind_animal: "Zwierzę",
  kind_plant: "Roślina",
  kind_object: "Przedmiot",
  learn: "Nauka",
  theme_from_start: "Od startu",
  unlock_or_buy: "{req} · lub {price}",
  hud_time: "Czas",
  hud_streak: "Seria",
  hud_crossings: "Przecięcia",
  hud_moves: "Ruchy",
  hud_pairs: "Par",
  hud_min_moves: "Min. ruchy",
  hint_echo: "Dotknij kryształu — sonar na chwilę pokaże struny i przecięcia.",
  hint_magnet: "Każdy kryształ wciąga do wolnego gniazda — wypełnij zarys, bez przecięć.",
  hint_untangle: "Przeciągnij kryształy wewnątrz okręgu, aż struny przestaną się przecinać.",
  cleared_default: "Rozplątane",
  board_aria: "Plansza Tangle Duel. Przeciągnij kryształy, aby rozplątać struny.",
  canvas_error: "Ta przeglądarka nie udostępniła płótna. Otwórz grę w aktualnym Safari lub Chrome.",
  album_found_meta: "{kind} · poz. {n}",
  album_locked_meta: "Poziom {n}",
  quest_kicker: "Misja",
  quest_claim: "Odbierz +{n}",
  quest_done: "Ścieżka ukończona",
  quest_path_done: "Wszystkie misje odebrane",
  quest_progress: "{n} / {total}",
  quest_reward: "+{n}",
  quest_q1_title: "Pierwsze węzły",
  quest_q1_detail: "Zalicz 3 poziomy kampanii",
  quest_q2_title: "Dzienna nić",
  quest_q2_detail: "Odbierz dzisiejsze Daily",
  quest_q3_title: "Błyskawica",
  quest_q3_detail: "Zalicz 5 układów w Błyskawicy (łącznie)",
  quest_q4_title: "Figura gwiazd",
  quest_q4_detail: "Odkryj 1 konstelację",
  quest_q5_title: "Stała ścieżka",
  quest_q5_detail: "Zalicz 10 poziomów kampanii",
  quest_q6_title: "Nić rywala",
  quest_q6_detail: "Utwórz pokój dla znajomego — albo zagraj kanapę na jednym telefonie",
  quest_q7_title: "Daleki brzeg",
  quest_q7_detail: "Dotrzyj do poziomu 20",
  quest_q8_title: "Suma błyskawic",
  quest_q8_detail: "Zalicz 15 układów Błyskawicy łącznie (wszystkie biegi)",
  quest_q9_title: "Pierwsza seria",
  quest_q9_detail: "Ustanów rekord Błyskawicy: 5 w jednym biegu",
  quest_q10_title: "Dłuższa ścieżka",
  quest_q10_detail: "Zalicz 25 poziomów kampanii",
  quest_q11_title: "Dwucyfrowy bieg",
  quest_q11_detail: "Ustanów rekord Błyskawicy: 10 w jednym biegu",
  quest_q12_title: "Album nieba",
  quest_q12_detail: "Odkryj 3 konstelacje",
  quest_q13_title: "Kroki Mistrza",
  quest_q13_detail: "Dotrzyj do trudności 5 w Mistrzu",
  quest_q14_title: "Koniec Zmierzchu",
  quest_q14_detail: "Dotrzyj do poziomu 36",
  quest_q15_title: "Rekord 15",
  quest_q15_detail: "Ustanów rekord Błyskawicy: 15 w jednym biegu",
  quest_q16_title: "Blask Echo",
  quest_q16_detail: "Zalicz 5 układów Echo (najlepsza seria)",
  quest_q17_title: "Burzowe godziny",
  quest_q17_detail: "Zalicz 40 układów Błyskawicy łącznie",
  quest_q18_title: "Półmetek",
  quest_q18_detail: "Zalicz 50 poziomów kampanii",
  quest_q19_title: "Sześć figur",
  quest_q19_detail: "Odkryj 6 konstelacji",
  quest_q20_title: "Rekord 20",
  quest_q20_detail: "Ustanów rekord Błyskawicy: 20 w jednym biegu",
  quest_q21_title: "Brama Mgławicy",
  quest_q21_detail: "Dotrzyj do poziomu 72",
  quest_q22_title: "Mistrz 12",
  quest_q22_detail: "Dotrzyj do trudności 12 w Mistrzu",
  quest_q23_title: "Sto clearów",
  quest_q23_detail: "Zalicz 100 poziomów kampanii",
  quest_q24_title: "Powódź błyskawic",
  quest_q24_detail: "Zalicz 80 układów Błyskawicy łącznie",
  quest_q25_title: "Koniec podróży",
  quest_q25_detail: "Dotrzyj do poziomu 180",
  tutorial_title: "Samouczek",
  tutorial_skip: "Pomiń",
  tutorial_next: "Dalej",
  tutorial_back: "Wracam",
  tutorial_hint: "Ciepła nić się krzyżuje. Jasna jest wolna.",
  tutorial_line_grab: "Złap kryształ w pomarańczowym kółku → przeciągnij na jasny punkt w wolnym miejscu.",
  tutorial_line_drop: "Puść przy jasnym punkcie.",
  tutorial_line_hold: "Trzymaj układ bez przecięć.",
  tutorial_line_white: "Puść, gdy nić zrobi się biała.",
  tutorial_line_solved: "Tak. Nic się nie krzyżuje.",
  tutorial_aria: "Samouczek. Przeciągnij kryształ w kółku do jasnego punktu, aż nici przestaną się krzyżować.",
  howto_kicker: "Zasady i tryby",
  howto_practice: "Ćwicz gest",
  howto_to_menu: "Do menu",
  howto_core_title: "Rdzeń",
  howto_core_detail: "Przeciągaj węzły w okręgu. Ciepła nić = przecięcie, jasna = wolna. 3 s czysto = clear.",
  howto_core_tag: "Podstawy",
  howto_campaign_title: "Podróż",
  howto_campaign_detail: "Poziomy przez pięć krain. Co 6. poziom odsłania konstelację do albumu.",
  howto_campaign_tag: "Kampania",
  howto_rush_title: "Błyskawica",
  howto_rush_detail: "Limit czasu. Każdy clear dodaje czas. Ścigaj najlepszą serię.",
  howto_rush_tag: "Tryby",
  howto_master_title: "Mistrz",
  howto_master_detail: "Własne węzły, limit ruchów, rosnąca trudność.",
  howto_master_tag: "Tryby",
  howto_echo_title: "Echo",
  howto_echo_detail: "Struny ukryte. Dotknij kryształu — sonar na chwilę pokaże układ.",
  howto_echo_tag: "Tryby",
  howto_daily_title: "Daily",
  howto_daily_detail: "Jeden wspólny układ dnia. Seria i kryształy za odbiór.",
  howto_daily_tag: "Wyzwanie",
  howto_duel_title: "Pojedynek",
  howto_duel_detail: "Kanapa (split) albo kod na dwa telefony. Ten sam splątek — kto pierwszy, wygrywa.",
  howto_duel_tag: "1v1",
};

const de: Dict = {
  ...en,
  crystals_count: "{n} Kristalle",
  play: "Spielen",
  level_n: "Level {n}",
  endless_n: "Endlos {n}",
  daily: "Daily",
  daily_done: "Heute geschafft",
  daily_layout: "Tageslayout · +{n}",
  streak_aria: "Serie {n} Tage",
  duel: "Duell",
  duel_detail: "Couch oder Code",
  duel_kicker: "Gleiches Layout · wer zuerst, gewinnt",
  duel_footer: "Ein Handy gegenüber · oder Raumcode online",
  duel_couch: "Ein Handy",
  duel_couch_detail: "Split-Screen · gegenübersitzen",
  duel_couch_tag: "Couch",
  duel_online: "Zwei Handys",
  duel_online_detail: "Raumcode · Live-Rennen",
  duel_online_tag: "Online",
  duel_online_kicker: "Zwei Handys",
  duel_online_intro: "Raum erstellen oder Code vom Freund. Kein Konto nötig.",
  duel_create: "Raum erstellen",
  duel_join: "Beitreten",
  duel_code_friend: "Code vom Freund",
  duel_room_code: "Raumcode",
  duel_waiting: "Warte auf Rivalen…",
  duel_connected_host: "Verbunden. Start gleich…",
  duel_connected_guest: "Verbunden. Warte auf Start…",
  duel_connecting: "Verbinde…",
  duel_start: "Start",
  duel_draw: "Unentschieden",
  duel_draw_detail: "Fast gleichzeitig — schön.",
  duel_win: "Du gewinnst",
  duel_win_detail: "Saubere Saiten zuerst — stark.",
  duel_rival: "Rivale gewinnt",
  duel_rival_detail: "Gute Runde. Die nächste kann dir gehören.",
  duel_again: "Nochmal",
  duel_end: "Ende",
  duel_error: "Fehler",
  duel_error_open: "Raum konnte nicht geöffnet werden.",
  duel_error_find: "Raum nicht gefunden.",
  duel_code_needed: "Code vom Freund eingeben.",
  modes: "Modi",
  modes_detail: "Blitz · Echo",
  levels: "Level",
  album: "Album",
  shop: "Shop",
  how_to_play: "Hilfe",
  mute_on: "Ton an",
  mute_off: "Stumm",
  settings: "Einstellungen",
  settings_kicker: "Ton & Fortschritt",
  sound: "Ton",
  sound_on: "Harfe an",
  sound_off: "Stille",
  haptics: "Vibration",
  haptics_on: "Beim Greifen",
  haptics_off: "Aus",
  language: "Sprache",
  language_auto: "System ({name})",
  language_system: "System",
  duel_settings_detail: "Rennen auf zwei Handys",
  tutorial_again: "Nochmal zeigen",
  reset_progress: "Fortschritt zurücksetzen",
  reset_detail: "Level & Album von vorn · Premium und Konto bleiben",
  reset_confirm: "Wirklich löschen?",
  reset_confirm_detail: "Nochmal tippen — Start bei 1 · Käufe bleiben",
  reset_ask_title: "Allen Fortschritt löschen?",
  reset_ask_body: "Kampagne, Album und Modi zurücksetzen. Premium, Konto und Käufe bleiben.",
  reset_yes: "Ja, alles löschen",
  reset_no: "Fortschritt behalten",
  confirm_cancel: "Abbrechen",
  back_menu: "Zurück zum Menü",
  modes_kicker: "Spielvarianten",
  modes_footer: "Meister & Echo speichern · Kristalle für jeden Clear",
  mode_rush: "Blitz",
  mode_rush_detail: "15 s · jeder Clear +4 s · Kristalle am Ende",
  mode_rush_tag: "Tempo",
  mode_rush_best: "Bestwert: {n}",
  mode_master: "Meister",
  mode_master_detail: "Eigene Knoten, immer schwerer · nur Züge im Limit · Kristalle",
  mode_master_tag: "Präzision",
  mode_master_progress: "Schwierigkeit {n} · Best {best}",
  mode_master_best: "Beste Schwierigkeit: {n}",
  mode_echo: "Echo",
  mode_echo_detail: "Saiten versteckt · gleiches Gewicht, neues Muster · Kristalle",
  mode_echo_tag: "Sinne",
  mode_echo_progress: "Layout {n} · Best {best}",
  mode_echo_best: "Beste Serie: {n}",
  mode_continue: "Weiter",
  rush_over: "Lauf vorbei",
  rush_again: "Nochmal",
  menu: "Menü",
  layouts_row: "Layouts in Folge",
  album_kicker: "{n} / {total} Konstellationen",
  album_hint: "Tippe eine freigeschaltete Figur für die Vorschau",
  album_preview_hint: "Lege den Umriss auf dem Brett — Kristalle rasten in Lichtmulden ein.",
  album_close: "Schließen",
  level_word: "Level",
  levels_title: "Reise",
  levels_kicker_empty: "Fünf Länder · ein Pfad",
  levels_kicker_progress: "{n} / {total} geschafft",
  map_path: "Pfad",
  map_realm_locked: "Bis Level {n}",
  map_constellation: "Figur",
  map_continue: "Weiter",
  realm_dusk: "Dämmerufer",
  realm_dusk_detail: "Erste Knoten · sanfte Dämmerung",
  realm_nebula: "Nebelschleier",
  realm_nebula_detail: "Dichtere Saiten · violetter Nebel",
  realm_glacier: "Gletscherpass",
  realm_glacier_detail: "Kaltes Licht · schärfere Kreuzungen",
  realm_ember: "Embergrat",
  realm_ember_detail: "Heiße Spannung · lange Züge",
  realm_garden: "Gartentor",
  realm_garden_detail: "Letzte Falten · stille Blüte",
  endless: "Endlos",
  endless_record: "Rekord: Level {n}",
  endless_unlocked: "Nach der Kampagne · ohne Ende",
  endless_locked: "Nach Level {n}",
  shop_title: "Shop",
  shop_earn: "Verdienen",
  shop_watch_ad: "Werbung ansehen",
  shop_ad_ready: "+{n} Kristalle",
  shop_ad_wait: "Gleich verfügbar",
  shop_themes: "Themes",
  shop_shapes: "Kristalle",
  shop_sounds: "Klänge",
  shop_effects: "Effekte",
  shop_packs: "Kristallpakete",
  shop_support: "Support",
  shop_active: "Aktiv",
  shop_unlocked: "Freigeschaltet",
  shop_active_board: "Aktiv auf dem Brett",
  shop_active_sound: "Aktiv",
  trail: "Lichtspur",
  trail_none: "Ohne Spur",
  trail_none_detail: "Kristall ohne Schweif",
  remove_ads: "Alles freischalten und Werbung entfernen",
  remove_ads_detail: "Themes, Formen, Klänge, Spur — einmalig {price}",
  remove_ads_owned: "Alles freigeschaltet · keine Werbung",
  premium_unlocked: "Alles freigeschaltet · keine Werbung",
  pack_small: "Kleines Paket",
  pack_medium: "Mittleres Paket",
  pack_large: "Großes Paket",
  pack_small_detail: "Schneller Schub",
  pack_medium_detail: "Am beliebtesten",
  pack_large_detail: "Vorrat für den Shop",
  need_crystals: "Du brauchst {n} Kristalle",
  theme_unlocked: "Theme freigeschaltet",
  shape_unlocked: "Form freigeschaltet",
  sound_unlocked: "Klang freigeschaltet",
  trail_unlocked: "Spur freigeschaltet",
  pack_claimed: "+{n} Kristalle · {name}",
  ad_reward: "+{n} Kristalle (Werbung folgt)",
  ad_wait: "Kurz warten auf die nächste Belohnung",
  daily_already: "Daily heute schon erledigt",
  daily_reward: "Daily! +{n} Kristalle",
  daily_streak_reward: "Daily · Serie {n} · +{crystals}",
  album_unlock: "Album: {name} · +{n}",
  progress_reset: "Fortschritt gelöscht · Level 1 · Premium bleibt",
  daily_reminder: "Daily-Erinnerung",
  daily_reminder_on: "An · gegen 10:00",
  daily_reminder_off: "Aus · tippen zum Einschalten",
  daily_reminder_denied: "Benachrichtigungen systemseitig blockiert",
  daily_reminder_unsupported: "Benachrichtigungen hier nicht verfügbar",
  daily_reminder_prompt: "Morgens an Daily erinnern?",
  daily_reminder_title: "Daily wartet",
  daily_reminder_body: "Ein neues Muster ist bereit · Tangle Duel öffnen",
  account_google: "Google-Konto",
  account_google_detail: "Fortschritt verknüpfen · Play-bereit",
  account_google_signin: "Mit Google anmelden",
  account_google_signout: "Abmelden",
  account_google_signed: "Angemeldet: {name}",
  account_google_missing: "NEXT_PUBLIC_GOOGLE_CLIENT_ID setzen für Login",
  account_google_error: "Anmeldung fehlgeschlagen · erneut versuchen",
  payments_soon: "Zahlungen bald",
  constellation_intro_kicker: "Konstellation",
  constellation_intro_title: "Lege die Sternfigur",
  constellation_intro_body:
    "Alle 6 Level erscheint ein Umriss — Tiere, Pflanzen und Gegenstände aus dem Album. Ziehe Kristalle in die Lichtmulden, bis die Saiten die Figur bilden. Die erste Entdeckung landet im Album.",
  constellation_intro_ok: "Verstanden",
  kind_animal: "Tier",
  kind_plant: "Pflanze",
  kind_object: "Objekt",
  learn: "Lernen",
  theme_from_start: "Vom Start",
  unlock_or_buy: "{req} · oder {price}",
  hud_time: "Zeit",
  hud_streak: "Serie",
  hud_crossings: "Kreuzungen",
  hud_moves: "Züge",
  hud_pairs: "Paare",
  hud_min_moves: "Min. Züge",
  hint_echo: "Tippe einen Kristall — Sonar zeigt kurz Saiten und Kreuzungen.",
  hint_magnet: "Magnet zieht in Lichtmulden — lege die Figur, ohne Kreuzungen.",
  hint_untangle: "Ziehe Kristalle im Kreis, bis die Saiten sich nicht mehr kreuzen.",
  cleared_default: "Entwirrt",
  board_aria: "Tangle-Duel-Brett. Ziehe Kristalle, um die Saiten zu entwirren.",
  canvas_error: "Dieser Browser hat kein Canvas bereitgestellt. Öffne das Spiel in aktuellem Safari oder Chrome.",
  album_found_meta: "{kind} · Lv. {n}",
  album_locked_meta: "Level {n}",
};

const es: Dict = {
  ...en,
  crystals_count: "{n} cristales",
  play: "Jugar",
  level_n: "Nivel {n}",
  endless_n: "Infinito {n}",
  daily: "Daily",
  daily_done: "Hecho hoy",
  daily_layout: "Diseño del día · +{n}",
  streak_aria: "Racha {n} días",
  duel: "Duelo",
  duel_detail: "Sofá o código",
  duel_kicker: "Mismo diseño · el primero gana",
  duel_footer: "Un móvil frente a frente · o código de sala online",
  duel_couch: "Un móvil",
  duel_couch_detail: "Pantalla partida · uno frente al otro",
  duel_couch_tag: "Sofá",
  duel_online: "Dos móviles",
  duel_online_detail: "Código de sala · carrera en vivo",
  duel_online_tag: "Online",
  duel_online_kicker: "Dos móviles",
  duel_online_intro: "Crea una sala o introduce el código de un amigo. Sin cuenta.",
  duel_create: "Crear sala",
  duel_join: "Unirse",
  duel_code_friend: "Código del amigo",
  duel_room_code: "Código de sala",
  duel_waiting: "Esperando rival…",
  duel_connected_host: "Conectado. Empieza pronto…",
  duel_connected_guest: "Conectado. Esperando el inicio…",
  duel_connecting: "Conectando…",
  duel_start: "Inicio",
  duel_draw: "Empate",
  duel_draw_detail: "Casi a la vez — bonito.",
  duel_win: "Ganas",
  duel_win_detail: "Cuerdas limpias primero — bien.",
  duel_rival: "Gana el rival",
  duel_rival_detail: "Gran ronda. La siguiente puede ser tuya.",
  duel_again: "Otra vez",
  duel_end: "Fin",
  duel_error: "Error",
  duel_error_open: "No se pudo abrir la sala.",
  duel_error_find: "Sala no encontrada.",
  duel_code_needed: "Introduce el código del amigo.",
  modes: "Modos",
  modes_detail: "Rayo · Eco",
  levels: "Niveles",
  album: "Álbum",
  shop: "Tienda",
  how_to_play: "Cómo jugar",
  mute_on: "Activar sonido",
  mute_off: "Silenciar",
  settings: "Ajustes",
  settings_kicker: "Sonido y progreso",
  sound: "Sonido",
  sound_on: "Arpa activada",
  sound_off: "Silencio",
  haptics: "Vibración",
  haptics_on: "Al agarrar el cristal",
  haptics_off: "Desactivada",
  language: "Idioma",
  language_auto: "Sistema ({name})",
  language_system: "Sistema",
  duel_settings_detail: "Carrera en dos móviles",
  tutorial_again: "Mostrar otra vez",
  reset_progress: "Reiniciar progreso",
  reset_detail: "Niveles y álbum desde cero · premium y cuenta se quedan",
  reset_confirm: "¿Borrar de verdad?",
  reset_confirm_detail: "Toca otra vez — nivel 1 · compras se quedan",
  reset_ask_title: "¿Borrar todo el progreso?",
  reset_ask_body: "Campaña, álbum y modos a cero. Premium, cuenta y compras se quedan.",
  reset_yes: "Sí, borrar todo",
  reset_no: "Conservar mi progreso",
  confirm_cancel: "Cancelar",
  back_menu: "Volver al menú",
  modes_kicker: "Variantes de juego",
  modes_footer: "Maestro y Eco guardan el progreso · cristales por cada clear",
  mode_rush: "Rayo",
  mode_rush_detail: "15 s · cada clear +4 s · cristales al final",
  mode_rush_tag: "Ritmo",
  mode_rush_best: "Récord: {n}",
  mode_master: "Maestro",
  mode_master_detail: "Diseños propios, cada vez más difíciles · límite de movimientos · cristales",
  mode_master_tag: "Precisión",
  mode_master_progress: "Dificultad {n} · récord {best}",
  mode_master_best: "Mejor dificultad: {n}",
  mode_echo: "Eco",
  mode_echo_detail: "Cuerdas ocultas · mismo peso, diseño nuevo · cristales",
  mode_echo_tag: "Sentidos",
  mode_echo_progress: "Diseño {n} · récord {best}",
  mode_echo_best: "Mejor racha: {n}",
  mode_continue: "Continuar",
  rush_over: "Fin de la ronda",
  rush_again: "Otra vez",
  menu: "Menú",
  layouts_row: "diseños seguidos",
  album_kicker: "{n} / {total} constelaciones",
  album_hint: "Toca una figura desbloqueada para previsualizar",
  album_preview_hint: "Monta este contorno en el tablero — los cristales encajan en pozos de luz.",
  album_close: "Cerrar",
  level_word: "Nivel",
  levels_title: "Viaje",
  levels_kicker_empty: "Cinco tierras · un camino",
  levels_kicker_progress: "{n} / {total} superados",
  map_path: "Camino",
  map_realm_locked: "Hasta el nivel {n}",
  map_constellation: "Figura",
  map_continue: "Continuar",
  realm_dusk: "Orilla del Crepúsculo",
  realm_dusk_detail: "Primeros nudos · crepúsculo suave",
  realm_nebula: "Velo de Nebulosa",
  realm_nebula_detail: "Cuerdas densas · niebla violeta",
  realm_glacier: "Paso del Glaciar",
  realm_glacier_detail: "Luz fría · cruces más nítidos",
  realm_ember: "Cresta Ember",
  realm_ember_detail: "Tensión caliente · tirones largos",
  realm_garden: "Puerta del Jardín",
  realm_garden_detail: "Últimos pliegues · flor quieta",
  endless: "Infinito",
  endless_record: "Récord: nivel {n}",
  endless_unlocked: "Tras la campaña · sin fin",
  endless_locked: "Tras el nivel {n}",
  shop_title: "Tienda",
  shop_earn: "Ganar",
  shop_watch_ad: "Ver anuncio",
  shop_ad_ready: "+{n} cristales",
  shop_ad_wait: "Pronto disponible",
  shop_themes: "Temas",
  shop_shapes: "Cristales",
  shop_sounds: "Sonidos",
  shop_effects: "Efectos",
  shop_packs: "Paquetes de cristales",
  shop_support: "Soporte",
  shop_active: "Activo",
  shop_unlocked: "Desbloqueado",
  shop_active_board: "Activo en el tablero",
  shop_active_sound: "Activo",
  trail: "Rastro de luz",
  trail_none: "Sin rastro",
  trail_none_detail: "Cristal sin estela",
  remove_ads: "Desbloquear todo y quitar anuncios",
  remove_ads_detail: "Temas, formas, sonidos, rastro — una vez {price}",
  remove_ads_owned: "Todo desbloqueado · sin anuncios",
  premium_unlocked: "Todo desbloqueado · sin anuncios",
  pack_small: "Paquete pequeño",
  pack_medium: "Paquete mediano",
  pack_large: "Paquete grande",
  pack_small_detail: "Impulso rápido",
  pack_medium_detail: "El más elegido",
  pack_large_detail: "Reserva para la tienda",
  need_crystals: "Necesitas {n} cristales",
  theme_unlocked: "Tema desbloqueado",
  shape_unlocked: "Forma desbloqueada",
  sound_unlocked: "Sonido desbloqueado",
  trail_unlocked: "Rastro desbloqueado",
  pack_claimed: "+{n} cristales · {name}",
  ad_reward: "+{n} cristales (aquí irá el anuncio)",
  ad_wait: "Espera un momento para la siguiente recompensa",
  daily_already: "Daily ya hecho hoy",
  daily_reward: "¡Daily! +{n} cristales",
  daily_streak_reward: "Daily · racha {n} · +{crystals}",
  album_unlock: "Álbum: {name} · +{n}",
  progress_reset: "Progreso borrado · nivel 1 · premium se queda",
  daily_reminder: "Recordatorio Daily",
  daily_reminder_on: "Activo · hacia las 10:00",
  daily_reminder_off: "Apagado · toca para activar",
  daily_reminder_denied: "Notificaciones bloqueadas en el sistema",
  daily_reminder_unsupported: "Notificaciones no disponibles aquí",
  daily_reminder_prompt: "¿Recordarte el Daily por la mañana?",
  daily_reminder_title: "Daily te espera",
  daily_reminder_body: "Hay un nuevo nudo · abre Tangle Duel",
  account_google: "Cuenta de Google",
  account_google_detail: "Vincula progreso · listo para Play",
  account_google_signin: "Entrar con Google",
  account_google_signout: "Cerrar sesión",
  account_google_signed: "Sesión: {name}",
  account_google_missing: "Añade NEXT_PUBLIC_GOOGLE_CLIENT_ID para el login",
  account_google_error: "No se pudo entrar · inténtalo de nuevo",
  payments_soon: "Pagos pronto",
  constellation_intro_kicker: "Constelación",
  constellation_intro_title: "Monta la figura estelar",
  constellation_intro_body:
    "Cada 6 niveles aparece un contorno — animales, plantas y objetos del álbum. Lleva los cristales a los pozos de luz hasta que las cuerdas formen la figura. El primer hallazgo va al Álbum.",
  constellation_intro_ok: "Entendido",
  kind_animal: "Animal",
  kind_plant: "Planta",
  kind_object: "Objeto",
  learn: "Aprender",
  theme_from_start: "Desde el inicio",
  unlock_or_buy: "{req} · o {price}",
  hud_time: "Tiempo",
  hud_streak: "Racha",
  hud_crossings: "Cruces",
  hud_moves: "Movimientos",
  hud_pairs: "Pares",
  hud_min_moves: "Mín. mov.",
  hint_echo: "Toca un cristal — el sónar muestra un momento cuerdas y cruces.",
  hint_magnet: "El imán atrae a pozos de luz — forma la figura, sin cruces.",
  hint_untangle: "Arrastra cristales dentro del círculo hasta que las cuerdas dejen de cruzarse.",
  cleared_default: "Desenredado",
  board_aria: "Tablero de Tangle Duel. Arrastra cristales para desenredar las cuerdas.",
  canvas_error: "Este navegador no ofreció un canvas. Abre el juego en Safari o Chrome actual.",
  album_found_meta: "{kind} · niv. {n}",
  album_locked_meta: "Nivel {n}",
};

const ru: Dict = {
  ...en,
  crystals_count: "{n} кристаллов",
  play: "Играть",
  level_n: "Уровень {n}",
  endless_n: "Бесконечность {n}",
  daily: "Daily",
  daily_done: "Сегодня пройдено",
  daily_layout: "Узор дня · +{n}",
  streak_aria: "Серия {n} дн.",
  duel: "Дуэль",
  duel_detail: "Диван или код",
  duel_kicker: "Один узор · кто первый, тот победил",
  duel_footer: "Один телефон лицом к лицу · или код комнаты онлайн",
  duel_couch: "Один телефон",
  duel_couch_detail: "Разделённый экран · напротив друг друга",
  duel_couch_tag: "Диван",
  duel_online: "Два телефона",
  duel_online_detail: "Код комнаты · гонка вживую",
  duel_online_tag: "Онлайн",
  duel_online_kicker: "Два телефона",
  duel_online_intro: "Создайте комнату или введите код друга. Без аккаунта.",
  duel_create: "Создать комнату",
  duel_join: "Войти",
  duel_code_friend: "Код друга",
  duel_room_code: "Код комнаты",
  duel_waiting: "Жду соперника…",
  duel_connected_host: "Связь есть. Скоро старт…",
  duel_connected_guest: "Связь есть. Жду старт…",
  duel_connecting: "Подключаюсь…",
  duel_start: "Старт",
  duel_draw: "Ничья",
  duel_draw_detail: "Почти вместе — красиво.",
  duel_win: "Вы победили",
  duel_win_detail: "Чистые струны первыми — отлично.",
  duel_rival: "Победил соперник",
  duel_rival_detail: "Отличный раунд. Следующий может быть ваш.",
  duel_again: "Ещё раз",
  duel_end: "Конец",
  duel_error: "Ошибка",
  duel_error_open: "Не удалось открыть комнату.",
  duel_error_find: "Комната не найдена.",
  duel_code_needed: "Введите код от друга.",
  modes: "Режимы",
  modes_detail: "Молния · Эхо",
  levels: "Уровни",
  album: "Альбом",
  shop: "Магазин",
  how_to_play: "Как играть",
  mute_on: "Включить звук",
  mute_off: "Без звука",
  settings: "Настройки",
  settings_kicker: "Звук и прогресс",
  sound: "Звук",
  sound_on: "Арфа включена",
  sound_off: "Тишина",
  haptics: "Вибрация",
  haptics_on: "При захвате кристалла",
  haptics_off: "Выкл.",
  language: "Язык",
  language_auto: "Системный ({name})",
  language_system: "Системный",
  duel_settings_detail: "Гонка на двух телефонах",
  tutorial_again: "Показать снова",
  reset_progress: "Сбросить прогресс",
  reset_detail: "Уровни и альбом с нуля · премиум и аккаунт остаются",
  reset_confirm: "Точно очистить?",
  reset_confirm_detail: "Ещё раз — старт с 1 · покупки остаются",
  reset_ask_title: "Сбросить весь прогресс?",
  reset_ask_body: "Кампания, альбом и режимы обнулятся. Премиум, аккаунт и покупки останутся.",
  reset_yes: "Да, сбросить всё",
  reset_no: "Оставить прогресс",
  confirm_cancel: "Отмена",
  back_menu: "В меню",
  modes_kicker: "Варианты игры",
  modes_footer: "Мастер и Эхо сохраняют прогресс · кристаллы за каждый клир",
  mode_rush: "Молния",
  mode_rush_detail: "15 с · каждый клир +4 с · кристаллы в конце",
  mode_rush_tag: "Темп",
  mode_rush_best: "Рекорд: {n}",
  mode_master: "Мастер",
  mode_master_detail: "Свои узлы, всё сложнее · только ходы в лимите · кристаллы",
  mode_master_tag: "Точность",
  mode_master_progress: "Сложность {n} · рекорд {best}",
  mode_master_best: "Лучшая сложность: {n}",
  mode_echo: "Эхо",
  mode_echo_detail: "Струны скрыты · тот же вес, новый узор · кристаллы",
  mode_echo_tag: "Чувства",
  mode_echo_progress: "Узор {n} · рекорд {best}",
  mode_echo_best: "Лучшая серия: {n}",
  mode_continue: "Продолжить",
  rush_over: "Забег окончен",
  rush_again: "Ещё раз",
  menu: "Меню",
  layouts_row: "узоров подряд",
  album_kicker: "{n} / {total} созвездий",
  album_hint: "Нажмите открытую фигуру для просмотра",
  album_preview_hint: "Соберите контур на поле — кристаллы входят в световые гнёзда.",
  album_close: "Закрыть",
  level_word: "Уровень",
  levels_title: "Путь",
  levels_kicker_empty: "Пять земель · одна тропа",
  levels_kicker_progress: "{n} / {total} пройдено",
  map_path: "Тропа",
  map_realm_locked: "До уровня {n}",
  map_constellation: "Фигура",
  map_continue: "Продолжить",
  realm_dusk: "Берег Заката",
  realm_dusk_detail: "Первые узлы · мягкий сумрак",
  realm_nebula: "Завеса Туманности",
  realm_nebula_detail: "Плотнее струны · фиолетовый туман",
  realm_glacier: "Ледниковый Перевал",
  realm_glacier_detail: "Холодный свет · острые пересечения",
  realm_ember: "Хребет Ember",
  realm_ember_detail: "Горячее натяжение · длинные тяги",
  realm_garden: "Врата Сада",
  realm_garden_detail: "Последние складки · тихий расцвет",
  endless: "Бесконечность",
  endless_record: "Рекорд: уровень {n}",
  endless_unlocked: "После кампании · без конца",
  endless_locked: "После уровня {n}",
  shop_title: "Магазин",
  shop_earn: "Заработок",
  shop_watch_ad: "Смотреть рекламу",
  shop_ad_ready: "+{n} кристаллов",
  shop_ad_wait: "Скоро будет доступно",
  shop_themes: "Темы",
  shop_shapes: "Кристаллы",
  shop_sounds: "Звуки",
  shop_effects: "Эффекты",
  shop_packs: "Наборы кристаллов",
  shop_support: "Поддержка",
  shop_active: "Активно",
  shop_unlocked: "Открыто",
  shop_active_board: "Активно на поле",
  shop_active_sound: "Активно",
  trail: "Световой след",
  trail_none: "Без следа",
  trail_none_detail: "Кристалл без шлейфа",
  remove_ads: "Открыть всё и убрать рекламу",
  remove_ads_detail: "Темы, формы, звуки, след — разово {price}",
  remove_ads_owned: "Всё открыто · без рекламы",
  premium_unlocked: "Всё открыто · без рекламы",
  pack_small: "Малый набор",
  pack_medium: "Средний набор",
  pack_large: "Большой набор",
  pack_small_detail: "Быстрый заряд",
  pack_medium_detail: "Самый частый выбор",
  pack_large_detail: "Запас для магазина",
  need_crystals: "Нужно {n} кристаллов",
  theme_unlocked: "Тема открыта",
  shape_unlocked: "Форма открыта",
  sound_unlocked: "Звук открыт",
  trail_unlocked: "След открыт",
  pack_claimed: "+{n} кристаллов · {name}",
  ad_reward: "+{n} кристаллов (здесь будет реклама)",
  ad_wait: "Подождите немного до следующей награды",
  daily_already: "Daily уже пройден сегодня",
  daily_reward: "Daily! +{n} кристаллов",
  daily_streak_reward: "Daily · серия {n} · +{crystals}",
  album_unlock: "Альбом: {name} · +{n}",
  progress_reset: "Прогресс сброшен · уровень 1 · премиум остаётся",
  daily_reminder: "Напоминание Daily",
  daily_reminder_on: "Вкл · около 10:00",
  daily_reminder_off: "Выкл · нажмите, чтобы включить",
  daily_reminder_denied: "Уведомления заблокированы в системе",
  daily_reminder_unsupported: "Уведомления здесь недоступны",
  daily_reminder_prompt: "Напоминать утром о Daily?",
  daily_reminder_title: "Daily ждёт",
  daily_reminder_body: "Новый узор готов · откройте Tangle Duel",
  account_google: "Аккаунт Google",
  account_google_detail: "Связать прогресс · готово к Play",
  account_google_signin: "Войти через Google",
  account_google_signout: "Выйти",
  account_google_signed: "Вход: {name}",
  account_google_missing: "Добавьте NEXT_PUBLIC_GOOGLE_CLIENT_ID для входа",
  account_google_error: "Не удалось войти · попробуйте снова",
  payments_soon: "Оплаты скоро",
  constellation_intro_kicker: "Созвездие",
  constellation_intro_title: "Соберите звёздную фигуру",
  constellation_intro_body:
    "Каждые 6 уровней появляется контур — животные, растения и предметы из альбома. Втяните кристаллы в световые гнёзда, пока струны не сложат фигуру. Первое открытие попадает в Альбом.",
  constellation_intro_ok: "Понятно",
  kind_animal: "Животное",
  kind_plant: "Растение",
  kind_object: "Предмет",
  learn: "Обучение",
  theme_from_start: "С самого начала",
  unlock_or_buy: "{req} · или {price}",
  hud_time: "Время",
  hud_streak: "Серия",
  hud_crossings: "Пересечения",
  hud_moves: "Ходы",
  hud_pairs: "Пары",
  hud_min_moves: "Мин. ходы",
  hint_echo: "Коснитесь кристалла — сонар на миг покажет струны и пересечения.",
  hint_magnet: "Магнит тянет в световые гнёзда — соберите контур без пересечений.",
  hint_untangle: "Тяните кристаллы внутри круга, пока струны не перестанут пересекаться.",
  cleared_default: "Распутано",
  board_aria: "Поле Tangle Duel. Тяните кристаллы, чтобы распутать струны.",
  canvas_error: "Этот браузер не дал холст. Откройте игру в актуальном Safari или Chrome.",
  album_found_meta: "{kind} · ур. {n}",
  album_locked_meta: "Уровень {n}",
};

export const MESSAGES: Record<LocaleId, Dict> = {
  en,
  pl,
  de,
  es,
  ru,
};
