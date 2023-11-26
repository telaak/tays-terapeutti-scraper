import axios from "axios";
import { TaysParser } from "./parser";

async function test() {
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

test();
