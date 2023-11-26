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

async function seppo() {
  const parser = new TaysParser();
  const html = (
    await axios.get(
      "https://www.tays.fi/fi-FI/Sairaanhoitopiiri/Alueellinen_yhteistyo/Mielenterveystyo/Terapeuttirekisteri/Pariperheterapia"
    )
  ).data;
  parser.parseTherapistTable(html);
}

// seppo();

test();
