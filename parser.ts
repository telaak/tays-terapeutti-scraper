import jsdom from "jsdom";
import axios from "axios";
import "dotenv/config";
import { Terapeutti } from "./types";
import { Kuntoutus } from "./enums";

const { JSDOM } = jsdom;

const links = [
  "https://www.tays.fi/fi-FI/Sairaanhoitopiiri/Alueellinen_yhteistyo/Mielenterveystyo/Terapeuttirekisteri/Hahmo_eli_gestaltterapia",
  "https://www.tays.fi/fi-FI/Sairaanhoitopiiri/Alueellinen_yhteistyo/Mielenterveystyo/Terapeuttirekisteri/Integratiivinen",
  "https://www.tays.fi/fi-FI/Sairaanhoitopiiri/Alueellinen_yhteistyo/Mielenterveystyo/Terapeuttirekisteri/Kognitiivinen",
  "https://www.tays.fi/fi-FI/Sairaanhoitopiiri/Alueellinen_yhteistyo/Mielenterveystyo/Terapeuttirekisteri/Kognitiivinen_kayttaytymisterapia",
  "https://www.tays.fi/fi-FI/Sairaanhoitopiiri/Alueellinen_yhteistyo/Mielenterveystyo/Terapeuttirekisteri/Kognitiivisanalyyttinen",
  "https://www.tays.fi/fi-FI/Sairaanhoitopiiri/Alueellinen_yhteistyo/Mielenterveystyo/Terapeuttirekisteri/Kriisi_ja_trauma",
  "https://www.tays.fi/fi-FI/Sairaanhoitopiiri/Alueellinen_yhteistyo/Mielenterveystyo/Terapeuttirekisteri/Kuvataideterapia",
  "https://www.tays.fi/fi-FI/Sairaanhoitopiiri/Alueellinen_yhteistyo/Mielenterveystyo/Terapeuttirekisteri/Musiikkiterapia",
  "https://www.tays.fi/fi-FI/Sairaanhoitopiiri/Alueellinen_yhteistyo/Mielenterveystyo/Terapeuttirekisteri/Neuropsykologinen_kuntoutus",
  "https://www.tays.fi/fi-FI/Sairaanhoitopiiri/Alueellinen_yhteistyo/Mielenterveystyo/Terapeuttirekisteri/Pariperheterapia",
  "https://www.tays.fi/fi-FI/Sairaanhoitopiiri/Alueellinen_yhteistyo/Mielenterveystyo/Terapeuttirekisteri/Psykodynaaminen",
  "https://www.tays.fi/fi-FI/Sairaanhoitopiiri/Alueellinen_yhteistyo/Mielenterveystyo/Terapeuttirekisteri/Ratkaisukeskeinen",
  "https://www.tays.fi/fi-FI/Sairaanhoitopiiri/Alueellinen_yhteistyo/Mielenterveystyo/Terapeuttirekisteri/Ryhmapsykoterapia",
];

export class TaysParser {
  private therapistHrefs: Set<string> = new Set();
  public therapists: Terapeutti[] = [];

  findTherapyType(code: string) {
    const found = Object.entries(Kuntoutus).find(([kuntoutus, koodi]) => {
      return koodi === code;
    });
    return found;
  }

  mapTherapyTypes(textContent: string) {
    const trimmed = textContent.trim();
    const split = trimmed.split(",");
    return split
      .map((code) => {
        const found = this.findTherapyType(code);
        return found ? found[0] : undefined;
      })
      .filter((v) => v);
  }

  async parseAllTherapists() {
    for (const link of links) {
      const html: string = (await axios.get(link)).data;
      const therapists = await this.parseTherapistTable(html);
      this.therapists.push(...therapists);
    }
    return this.therapists;
  }

  async parseTherapistTable(html: string) {
    const therapists: Partial<Terapeutti>[] = [];
    const document = new JSDOM(html).window.document;
    const table = document.querySelector("table") as HTMLTableElement;
    const rows = table.querySelectorAll("tr");
    const rowArray = Array.from(rows);
    const sliced = rowArray.slice(1);
    for (const row of sliced) {
      const children = row.children;
      const cells = row.querySelectorAll("td");
      const href = row.querySelector("a")!.getAttribute("href") as string;
      const Pätevyys = this.mapTherapyTypes(
        cells[0].childNodes[cells[0].childNodes.length - 1]
          .textContent as string
      ) as string[];
      const Tilaa = children[1]?.textContent?.trim() as string;
      const Paikkakunta = children[2]?.textContent?.trim() as string;
      const Kohderyhmä = children[3]?.textContent?.trim() as string;
      if (this.therapistHrefs.has(href)) {
        console.log(`duplicate: ${href}`);
      } else {
        this.therapistHrefs.add(href);
        console.log(href);
        const moreData = await this.parseTherapist(`https://tays.fi/${href}`);
        const newTherapist: Partial<Terapeutti> = {
          Tilaa,
          Paikkakunta,
          Kohderyhmä,
          Pätevyys,
          ...moreData,
        };
        console.log(newTherapist);
        therapists.push(newTherapist);
      }
    }
    return therapists as Terapeutti[];
  }

  findRow(rows: HTMLTableRowElement[], key: string): string {
    try {
      const foundRow = rows.find((row) => {
        const keyCell = row.children[0];
        const cellValue = (keyCell.textContent as string).trim();
        return cellValue === key;
      });
      return foundRow?.children[1].textContent?.trim() as string;
    } catch (error) {
      console.error(error);
      return "";
    }
  }

  splitAndTrim(string: string, separator = ",") {
    try {
      return string
        .split(separator)
        .map((s) => s.trim())
        .filter((v) => v);
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async parseTherapist(href: string) {
    try {
      const html: string = (await axios.get(href)).data;
      const document = new JSDOM(html).window.document;
      const header = document.querySelector("h1") as HTMLHeadingElement;
      const [fullName, Ammattinimike] = header.textContent?.split(
        "\n"
      ) as string[];
      const splitName = fullName.split(",").map((s) => s.trim());
      const Etunimi = splitName[1] as string;
      const Sukunimi = splitName[0] as string;
      const table = document.querySelector("table") as HTMLTableElement;
      const rows = table.querySelectorAll("tr");
      const rowArray = Array.from(rows);
      const Vastaanotot = Array.from(rowArray[0].children)
        .filter((n) => n.textContent)
        .map((n) => n.textContent?.trim()) as string[];
      const Ajanvaraus = this.findRow(rowArray, "Puhelin");
      const Puhelin = this.splitAndTrim(this.findRow(rowArray, "Kotisivut"));
      const Sähköposti = this.splitAndTrim(
        this.findRow(rowArray, "Sähköposti")
      );
      const Kotisivut = this.splitAndTrim(this.findRow(rowArray, "Kotisivut"));
      const Koulutus = this.findRow(rowArray, "Koulutus");
      const Suuntaus = this.findRow(rowArray, "Suuntaus");
      const Lisätiedot = this.findRow(rowArray, "Lisätiedot");
      const Kela = this.findRow(rowArray, "Kela");
      const Kelalisätiedot = this.findRow(rowArray, "Kela lisätiedot");
      const Kieli = this.findRow(rowArray, "Kieli");
      const therapist: Partial<Terapeutti> = {
        Vastaanotot,
        Ajanvaraus,
        Puhelin,
        Sähköposti,
        href,
        Sukunimi,
        Etunimi,
        Ammattinimike,
        Kela,
        Kelalisätiedot,
        Kieli,
        Kotisivut,
        Koulutus,
        Suuntaus,
        Lisätiedot,
      };
      return therapist;
    } catch (error) {
      console.error(error);
      return {};
    }
  }
}
