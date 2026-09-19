import { PrismaClient, Category } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CATEGORY_MAP: Record<string, Category> = {
  Sequels: Category.EDUCATIONAL,
  "DevSecOps & cloud": Category.TECHNICAL,
  "Hands-on": Category.TECHNICAL,
  Community: Category.LIFESTYLE,
  "SA & industry": Category.EDUCATIONAL,
};

const ideas = [
  { title: "Cybersecurity Salaries in SA 2026: What Recruiters Are Actually Paying", cat: "Sequels", pitch: "Follow-up to your top career video, with fresh numbers from recruiters and Hacking Hub members.", top: false },
  { title: "What a Cybersecurity Salary Actually Affords You in South Africa", cat: "Sequels", pitch: "Rent, car and lifestyle budget breakdown. Combines the appeal of the GTI video with the salaries video.", top: true },
  { title: "Cybersecurity Roadmap 2027 South Africa", cat: "Sequels", pitch: "Schedule for December like last year's roadmap (your best earner) and note what changed from 2026.", top: false },
  { title: "Mistakes I Made in My First Year of Cybersecurity", cat: "Sequels", pitch: "Personal reflection that fits the vlog audience.", top: false },
  { title: "Why I Left the SOC for DevSecOps", cat: "DevSecOps & cloud", pitch: "The move, the interview, and what's different. Make it while the career change is fresh.", top: true },
  { title: "SOC Analyst vs DevSecOps Engineer: Salary, Skills and Stress", cat: "DevSecOps & cloud", pitch: "A searchable comparison video.", top: false },
  { title: "My First Month as a DevSecOps Engineer", cat: "DevSecOps & cloud", pitch: "Continues the week-in-the-life format with a new angle.", top: false },
  { title: "Cloud Security Roadmap After AZ-104", cat: "DevSecOps & cloud", pitch: "What comes next (AZ-500, SC-200) and why.", top: false },
  { title: "Studying for AZ-500 in Public", cat: "DevSecOps & cloud", pitch: "Short series with weekly updates and a pass-or-fail finale.", top: false },
  { title: "Investigating a Real Phishing Email Like a SOC Analyst", cat: "Hands-on", pitch: "Screen-recorded triage walkthrough. Starts the technical side of the channel.", top: true },
  { title: "Build a SOC Home Lab on an Old Laptop (Free)", cat: "Hands-on", pitch: "Set up a SIEM with a vulnerable machine to practise on.", top: false },
  { title: "AI Tools I Actually Use as a Security Engineer", cat: "Hands-on", pitch: "Practical follow-up to the 'Will AI take over' event video.", top: false },
  { title: "Scams Targeting South Africans Right Now", cat: "Hands-on", pitch: "Fake SARS emails, bank SMS phishing, WhatsApp takeovers. Cut clips into Shorts.", top: false },
  { title: "How to Build a Cyber Portfolio That Gets Interviews", cat: "Hands-on", pitch: "GitHub, write-ups and a personal site. Natural sequel to the LinkedIn video.", top: false },
  { title: "Mock SOC Analyst Interview with a Hacking Hub Member", cat: "Community", pitch: "Real questions, followed by your breakdown of the answers.", top: false },
  { title: "Following a Member from Day 1 to Hired", cat: "Community", pitch: "Multi-part series that goes deeper than the one-off success stories.", top: false },
  { title: "Hacking Hub CTF Challenge: Can Members Beat My Room?", cat: "Community", pitch: "Film it at the next meetup.", top: false },
  { title: "What SA Hiring Managers Look For (Interview with a CISO)", cat: "Community", pitch: "The employer's perspective on landing a job.", top: false },
  { title: "Learnerships and Internships in SA Cyber: Where to Find Them", cat: "SA & industry", pitch: "Search-friendly video for the core audience.", top: false },
  { title: "How to Earn Dollars from South Africa in Cybersecurity", cat: "SA & industry", pitch: "Remote roles, freelancing and bug bounties.", top: false },
];

async function main() {
  const count = await prisma.youtubeVideo.count();
  if (count > 0) {
    console.log(`Skipping seed: ${count} YoutubeVideo rows already exist.`);
    return;
  }

  for (const idea of ideas) {
    await prisma.youtubeVideo.create({
      data: {
        title: idea.title,
        pitch: idea.pitch,
        category: CATEGORY_MAP[idea.cat],
        topPick: idea.top,
      },
    });
  }

  console.log(`Seeded ${ideas.length} YouTube video ideas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
