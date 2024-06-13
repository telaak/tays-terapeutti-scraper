import { CronJob } from "cron";
import { PirhaParser } from "./PirhaParser";
import "dotenv/config";

async function parse() {
  const parser = new PirhaParser();
  const therapists = await parser.parseAllTherapists();
  console.log("done");
}

if (process.env.PARSE_ON_BOOT === "true") {
  try {
    console.log("parsing on boot");
    parse().then(() => process.exit(0));
  } catch (error) {
    console.error(error);
  }
}

if (process.env.CRON) {
  console.log(`cronjob scheduled for ${process.env.CRON}`);
  const job = CronJob.from({
    cronTime: process.env.CRON,
    onTick: function () {
      try {
        parse();
      } catch (error) {
        console.error(error);
      }
    },
    start: true,
    timeZone: "Europe/Helsinki",
  });
}
