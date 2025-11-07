// genders

export enum Genders {
  Male = "male",
  Female = "female",
  Couple = "couple",
}

export const GENDER_OPTIONS = [
  { value: Genders.Male, label: "Male 🧔" },
  { value: Genders.Female, label: "Female 👩" },
  { value: Genders.Couple, label: "Couple 👫" },
];

// languages

export enum Languages {
  English = "🇬🇧 English",
  German = "🇩🇪 Deutsch",
  French = "🇫🇷 Français",
  Italian = "🇮🇹 Italiano",
  Spanish = "🇪🇸 Español",
  Portuguese = "🇵🇹 Português",
  Polish = "🇵🇱 Polski",
  Ukrainian = "🇺🇦 Українська",
  Russian = "🇷🇺 Русский",
  Belarusian = "🇧🇾 Беларуская",
  Czech = "🇨🇿 Čeština",
  Slovak = "🇸🇰 Slovenčina",
  Georgian = "🇬🇪 ქართული",
  Hungarian = "🇭🇺 Magyar",
  Romanian = "🇷🇴 Română",
  Bulgarian = "🇧🇬 Български",
  Greek = "🇬🇷 Ελληνικά",
  Dutch = "🇳🇱 Nederlands",
  Swedish = "🇸🇪 Svenska",
  Norwegian = "🇳🇴 Norsk bokmål",
  Danish = "🇩🇰 Dansk",
  Finnish = "🇫🇮 Suomi",
  Estonian = "🇪🇪 Eesti",
  Latvian = "🇱🇻 Latviešu",
  Lithuanian = "🇱🇹 Lietuvių",
  Icelandic = "🇮🇸 Íslenska",
}

export const LANGUAGE_OPTIONS = [
  { value: "en", label: Languages.English },
  { value: "de", label: Languages.German },
  { value: "fr", label: Languages.French },
  { value: "it", label: Languages.Italian },
  { value: "es", label: Languages.Spanish },
  { value: "pt", label: Languages.Portuguese },
  { value: "pl", label: Languages.Polish },
  { value: "uk", label: Languages.Ukrainian },
  { value: "ru", label: Languages.Russian },
  { value: "be", label: Languages.Belarusian },
  { value: "cs", label: Languages.Czech },
  { value: "sk", label: Languages.Slovak },
  { value: "ka", label: Languages.Georgian },
  { value: "hu", label: Languages.Hungarian },
  { value: "ro", label: Languages.Romanian },
  { value: "bg", label: Languages.Bulgarian },
  { value: "el", label: Languages.Greek },
  { value: "nl", label: Languages.Dutch },
  { value: "sv", label: Languages.Swedish },
  { value: "nb", label: Languages.Norwegian },
  { value: "da", label: Languages.Danish },
  { value: "fi", label: Languages.Finnish },
  { value: "et", label: Languages.Estonian },
  { value: "lv", label: Languages.Latvian },
  { value: "lt", label: Languages.Lithuanian },
  { value: "is", label: Languages.Icelandic },
];

// tags

export const CORE_TAG_ORDER = [
  "boundaries",
  "comfort",
  "communication",
  "couples_meet",
  "drinks",
  "food",
  "leisure",
  "places",
  "planning",
  "romance",
  "safety",
  "values",
] as const;

export type CoreTag = (typeof CORE_TAG_ORDER)[number];
  