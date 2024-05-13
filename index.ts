import axios from "axios";
import { CronJob } from "cron";
import { PirhaParser } from "./PirhaParser";
import 'dotenv/config'

async function parse() {
  const parser = new PirhaParser();
  const therapists = await parser.parseAllTherapists();
}

if (process.env.PARSE_ON_BOOT === "true") {
  try {
    parse();
  } catch (error) {
    console.error(error);
  }
}

if (process.env.CRON) {
  console.log(`cronjob scheduled for ${process.env.CRON}`);
  const job = CronJob.from({
    cronTime: process.env.CRON,
    onTick: function () {
      parse();
    },
    start: true,
    timeZone: "Europe/Helsinki",
  });
}
