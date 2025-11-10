import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authCookieOptions, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_MESSAGE_LENGTH = 230;
const MAX_STORED_MESSAGES = 20;
const WINDOW_MESSAGES = 20;

const urlPattern = /(https?:\/\/|www\.)/i;

const bannedWords = [
  "fuck",
  "fck",
  "fuk",
  "fukk",
  "fucking",
  "fuking",
  "f0ck",
  "shit",
  "sh1t",
  "shyt",
  "shitty",
  "motherfucker",
  "motherfuker",
  "mfker",
  "bitch",
  "b1tch",
  "bich",
  "biatch",
  "slut",
  "whore",
  "hoe",
  "hoebag",
  "hooker",
  "skank",
  "sknkr",
  "tramp",
  "thot",
  "th0t",
  "cunt",
  "cnt",
  "kant",
  "cuunt",
  "pussy",
  "pusy",
  "p0ssy",
  "vag",
  "twat",
  "tw@t",
  "asshole",
  "ass",
  "azz",
  "arse",
  "arsehole",
  "jackass",
  "dumbass",
  "badass",
  "smartass",
  "cock",
  "kok",
  "c0ck",
  "kock",
  "dick",
  "dik",
  "d1ck",
  "dic",
  "dildo",
  "dilldoe",
  "prick",
  "penis",
  "peen",
  "schlong",
  "balls",
  "ballz",
  "bollocks",
  "nutjob",
  "boob",
  "boobs",
  "tits",
  "titty",
  "t1ts",
  "titfuck",
  "cum",
  "cumm",
  "cumming",
  "jizz",
  "j1zz",
  "spunk",
  "spooge",
  "orgasm",
  "ejaculate",
  "semen",
  "anal",
  "anus",
  "buttsex",
  "rimjob",
  "rimj0b",
  "blowjob",
  "bj",
  "handjob",
  "hj",
  "doggystyle",
  "doggy",
  "missionary",
  "deepthroat",
  "strapon",
  "masturbate",
  "masturbation",
  "mastrbate",
  "wank",
  "wanker",
  "jerkoff",
  "jerking",
  "sukdik",
  "suckdick",
  "eatass",
  "felatio",
  "fellatio",
  "cunnilingus",
  "buttplug",
  "porn",
  "porno",
  "pron",
  "pornhub",
  "xvideos",
  "xnxx",
  "sex",
  "sexo",
  "sexual",
  "sexxx",
  "nsfw",
  "nude",
  "nud3",
  "nudity",
  "boobjob",
  "titjob",
  "milf",
  "gilf",
  "daddy",
  "sugarbaby",
  "pimp",
  "escort",
  "trafficking",
  "rape",
  "r4pe",
  "rapist",
  "raping",
  "molest",
  "molester",
  "pedo",
  "ped0",
  "pedophile",
  "childporn",
  "cp",
  "beastiality",
  "zoophilia",
  "bestiality",
  "incest",
  "loli",
  "lolicon",
  "shotacon",
  "retard",
  "retarded",
  "r3tard",
  "idiot",
  "moron",
  "imbecile",
  "stupid",
  "dumb",
  "dumba55",
  "douche",
  "douchebag",
  "bastard",
  "basturd",
  "sucker",
  "sucka",
  "jerk",
  "loser",
  "weirdo",
  "freak",
  "lardass",
  "fatty",
  "fatass",
  "pig",
  "p1g",
  "cow",
  "ugly",
  "uggo",
  "scum",
  "scumbag",
  "snitch",
  "rat",
  "terrorist",
  "isis",
  "bomb",
  "bombing",
  "die",
  "suicide",
  "kill",
  "killer",
  "kys",
  "kms",
  "murder",
  "murderer",
  "stab",
  "shoot",
  "shootup",
  "hang",
  "lynch",
  "gaschamber",
  "burn",
  "burner",
  "arson",
  "suffocate",
  "asphyxiate",
  "poison",
  "poisoning",
  "overdose",
  "od",
  "chloroform",
  "silencer",
  "gun",
  "guns",
  "weapon",
  "grenade",
  "grenades",
  "bombs",
  "explosive",
  "explosives",
  "shooter",
  "shooting",
  "assassin",
  "assassinate",
  "carbomb",
  "knife",
  "knives",
  "shiv",
  "shank",
  "shanking",
  "torture",
  "torturing",
  "bloodlust",
  "slaughter",
  "massacre",
  "genocide",
  "ethniccleanse",
  "racist",
  "racism",
  "bigot",
  "bigotry",
  "nazi",
  "hitler",
  "fascist",
  "whitepower",
  "whitepride",
  "kkk",
  "klux",
  "whitegenocide",
  "supremacy",
  "supremacist",
  "chink",
  "chingchong",
  "wetback",
  "beaner",
  "spic",
  "gringo",
  "cracker",
  "cracka",
  "redneck",
  "hillbilly",
  "gypo",
  "paki",
  "pak1",
  "sandnigger",
  "sandnigga",
  "zipperhead",
  "gook",
  "g00k",
  "slur",
  "slaur",
  "midget",
  "dwarf",
  "cripple",
  "handicapped",
  "vegetable",
  "mentallyill",
  "psycho",
  "psychopath",
  "sociopath",
  "drug",
  "drugs",
  "drugdealer",
  "coke",
  "cocaine",
  "meth",
  "methhead",
  "crack",
  "crackhead",
  "weed",
  "marijuana",
  "pothead",
  "stoner",
  "heroin",
  "opioid",
  "opiate",
  "ketamine",
  "lsd",
  "acid",
  "shrooms",
  "molly",
  "ecstasy",
  "xanax",
  "xanny",
  "lean",
  "percs",
  "percocet",
  "adderall",
  "duster",
  "bathsalts",
  "chloro",
  "od",
  "overdose",
  "dealer",
  "trafficker",
  "smuggler",
  "cartel",
  "gangbang",
  "gangbanger",
  "triad",
  "niga",
  "nigger",
  "nigas",
  "niggers",
];

const normalizeContent = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

const isAllowedChar = (char: string) => {
  const code = char.codePointAt(0);
  if (!code) {
    return true;
  }

  // Allow common whitespace
  if (code === 10 || code === 13 || code === 32) {
    return true;
  }

  // Allow standard ASCII printable range
  if (code >= 33 && code <= 126) {
    return true;
  }

  // Allow typical emoji ranges
  if (
    (code >= 0x1f000 && code <= 0x1ffff) ||
    (code >= 0x2700 && code <= 0x27bf) ||
    (code >= 0x2600 && code <= 0x26ff)
  ) {
    return true;
  }

  return false;
};

const computeLevel = (balance: number, pending: number) =>
  Math.max(1, Math.floor((balance + pending) / 100) + 1);

export async function GET() {
  const messages = await prisma.chatMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: WINDOW_MESSAGES,
    include: {
      user: { select: { username: true, id: true, isAdmin: true } },
    },
  });

  return NextResponse.json(
    messages.reverse().map((message) => ({
      id: message.id,
      content: message.content,
      level: message.level,
      createdAt: message.createdAt,
      username: message.user.username,
      userId: message.user.id,
      isAdmin: message.user.isAdmin,
    }))
  );
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(authCookieOptions.name)?.value ??
    req.cookies.get(authCookieOptions.name)?.value;
  const userId = verifyToken(token);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { content?: string } = {};

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const content = (payload.content ?? "").trim();

  if (!content) {
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  }

  if (content.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message too long. Max ${MAX_MESSAGE_LENGTH} characters.` },
      { status: 400 }
    );
  }

  if (urlPattern.test(content)) {
    return NextResponse.json(
      { error: "Links are not allowed in chat." },
      { status: 400 }
    );
  }

  const hasUnsupported = Array.from(content).some(
    (char) => !isAllowedChar(char)
  );
  if (hasUnsupported) {
    return NextResponse.json(
      { error: "Unsupported characters detected. Use standard text or emoji." },
      { status: 400 }
    );
  }

  const normalized = normalizeContent(content);
  if (bannedWords.some((word) => normalized.includes(word))) {
    return NextResponse.json(
      { error: "Watch the language. Message rejected." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      balance: true,
      pending: true,
      chatMutedUntil: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.chatMutedUntil && user.chatMutedUntil > new Date()) {
    return NextResponse.json(
      {
        error: `You are muted until ${user.chatMutedUntil.toLocaleString()}.`,
      },
      { status: 403 }
    );
  }

  const level = computeLevel(Number(user.balance), Number(user.pending));

  const message = await prisma.chatMessage.create({
    data: {
      content,
      userId: user.id,
      level,
    },
    include: {
      user: { select: { username: true, id: true, isAdmin: true } },
    },
  });

  // Trim stored chat history to the latest MAX_STORED_MESSAGES
  const overflow = await prisma.chatMessage.findMany({
    orderBy: { createdAt: "desc" },
    skip: MAX_STORED_MESSAGES,
    select: { id: true },
  });

  if (overflow.length) {
    await prisma.chatMessage.deleteMany({
      where: { id: { in: overflow.map((item) => item.id) } },
    });
  }

  return NextResponse.json(
    {
      id: message.id,
      content: message.content,
      level: message.level,
      createdAt: message.createdAt,
      username: message.user.username,
      userId: message.user.id,
      isAdmin: message.user.isAdmin,
    },
    { status: 201 }
  );
}
