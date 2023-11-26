import axios from "axios";
import { TaysParser } from "./parser";
import { CronJob } from "cron";

async function parse() {
  const parser = new TaysParser();
  const therapists = await parser.parseAllTherapists();
  if (process.env.API_URL) {
    try {
      axios.post(process.env.API_URL, therapists);
    } catch (error) {
      console.error(error);
    }
  }
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
