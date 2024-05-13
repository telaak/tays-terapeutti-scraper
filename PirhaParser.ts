import axios from "axios";
import jsdom from "jsdom";
import { writeFile, mkdir } from "fs/promises";
import { ContactInfo, TherapyInfo } from "./newTypes";
const { JSDOM } = jsdom;

const links = [
  "https://www.pirha.fi/web/psykoterapeuttirekisteri/yksiloterapia/integratiivinen-psykoterapia",
  "https://www.pirha.fi/web/psykoterapeuttirekisteri/yksiloterapia/kognitiivinen-psykoterapia",
  "https://www.pirha.fi/web/psykoterapeuttirekisteri/yksiloterapia/kognitiivis-analyyttinen-psykoterapia",
  "https://www.pirha.fi/web/psykoterapeuttirekisteri/yksiloterapia/kognitiivinen-kayttaytymisterapia",
  "https://www.pirha.fi/web/psykoterapeuttirekisteri/yksiloterapia/kriisi-ja-traumaterapia",
  "https://www.pirha.fi/web/psykoterapeuttirekisteri/yksiloterapia/psykodynaaminen-ja-analyyttinen-psykoterapia",
  "https://www.pirha.fi/web/psykoterapeuttirekisteri/yksiloterapia/ratkaisukeskeinen-psykoterapia",
  "https://www.pirha.fi/web/psykoterapeuttirekisteri/yksiloterapia/muut-yksiloterapiat",
];

class PirhaParser {
  public therapists: any[] = [];

  async parseAllTherapists() {
    for (const link of links) {
      const html: string = (await axios.get(link)).data;
      const therapists = await this.parseTherapistTable(html, link);
      this.therapists.push(...therapists);
    }
    return this.therapists;
  }

  parseTherapist(html: string) {
    const therapist = new JSDOM(html).window.document;

    let therapistJson: any = {};

    const ingress = therapist.querySelector(".ingress") as HTMLParagraphElement;

    if (ingress) {
      therapistJson.jobTitle = ingress.textContent;
    }

    const paragraphs = Array.from(therapist.querySelectorAll("p"));

    const lists = Array.from(therapist.querySelectorAll("ul"));

    try {
      const receptionNode = paragraphs.find(
        (p) =>
          p.textContent?.includes("Vastaanotot") ||
          p.textContent?.includes('"Vastaanotto')
      ) as HTMLParagraphElement;
      const reception = this.parseReceptionNode(receptionNode);
      therapistJson.reception = reception;
    } catch (error) {
      console.error(error);
    }

    try {
      const contactInfoList = lists.find((n) =>
        n.previousElementSibling?.textContent?.includes("Yhteystiedot")
      ) as HTMLUListElement;

      const contactInfo = this.parseContactInfoNode(contactInfoList);
      therapistJson.contactInfo = contactInfo;
    } catch (error) {
      console.error(error);
    }

    try {
      const educationList = lists.find((n) =>
        n.previousElementSibling?.textContent?.includes("Koulutus")
      ) as HTMLUListElement;

      if (!educationList) {
        const educationParagraph = paragraphs.find((n) =>
          n.textContent?.includes("Koulutus")
        ) as HTMLParagraphElement;
        const education = Array.from(educationParagraph.childNodes)
          .filter((n) => n.nodeName === "#text")
          .map((n) => n.textContent?.trim());
        therapistJson.education = education;
      } else {
        const education = Array.from(educationList.querySelectorAll("li")).map(
          (n) => n.textContent?.trim()
        );
        therapistJson.education = education;
      }
    } catch (error) {
      console.error(error);
    }

    try {
      const therapyInfoList = lists.find((n) =>
        n.previousElementSibling?.textContent?.includes("Terapiatiedot")
      ) as HTMLUListElement;
      const therapyInfo = this.parseTherapyInfoNode(therapyInfoList);
      therapistJson.therapyInfo = therapyInfo;
    } catch (error) {
      console.error(error);
    }

    return therapistJson;
  }

  parseTherapyInfoNode(therapyInfoNode: HTMLUListElement) {
    const listElements = Array.from(therapyInfoNode.querySelectorAll("li"));

    let therapyInfo: Partial<TherapyInfo> = {};

    try {
      const languagesNodeIndex = listElements.findIndex((n) =>
        n.textContent?.includes("Psykoterapiakielet: ")
      );
      const languageNode = listElements
        .splice(languagesNodeIndex, 1)
        .pop() as HTMLLIElement;

      const languages = languageNode.textContent
        ?.replace("Psykoterapiakielet: ", "")
        .split(",")
        .map((t) => t.trim()) as string[];
      therapyInfo.languages = languages;
    } catch (error) {
      console.error(error);
    }

    try {
      const targetGroupNodeIndex = listElements.findIndex((n) =>
        n.textContent?.includes("Kohderyhmä: ")
      );

      const targetGroupNode = listElements
        .splice(targetGroupNodeIndex, 1)
        .pop() as HTMLLIElement;

      const targetGroups = targetGroupNode.textContent
        ?.replace("Kohderyhmä: ", "")
        .split(",")
        .map((t) => t.trim()) as string[];

      therapyInfo.targetGroups = targetGroups;
    } catch (error) {
      console.error(error);
    }

    try {
      const additionalInfo = listElements.map((n) =>
        n.textContent?.trim()
      ) as string[];
      therapyInfo.additionalInfo = additionalInfo;
    } catch (error) {
      console.error(error);
    }

    return therapyInfo;
  }

  parseContactInfoNode(contactInfoNode: HTMLUListElement) {
    let contactInfo: Partial<ContactInfo> = {};

    const listElements = Array.from(contactInfoNode.querySelectorAll("li"));

    try {
      const phoneNumberNodeIndex = listElements.findIndex((n) =>
        n.textContent?.includes("Puhelin")
      );
      const phoneNumberNode = listElements
        .splice(phoneNumberNodeIndex, 1)
        .pop() as HTMLLIElement;
      if (phoneNumberNode) {
        const phoneNumber = phoneNumberNode?.textContent?.replace(/\D/g, "");
        contactInfo.phoneNumber = phoneNumber;
      }
    } catch (error) {
      console.error(error);
    }

    try {
      const emailNodeIndex = listElements.findIndex((n) =>
        n.textContent?.includes("Sähköposti")
      );
      const emailNode = listElements
        .splice(emailNodeIndex, 1)
        .pop() as HTMLLIElement;
      if (emailNode) {
        const email = emailNode?.textContent
          ?.replace(/Sähköposti/, "")
          .replace(/\s/g, "");
        contactInfo.email = email;
      }
    } catch (error) {
      console.error(error);
    }

    try {
      const extraInfo = listElements
        .filter((n) => n.textContent)
        .map((n) => n.textContent?.trim()) as string[];
      contactInfo.extraInfo = extraInfo;
    } catch (error) {
      console.error(error);
    }

    return contactInfo;
  }

  parseReceptionNode(reception: HTMLParagraphElement) {
    const childNodes = Array.from(reception.childNodes);
    const textNodes = childNodes.filter((n) => n.nodeName === "#text");
    const mappedAndTrimmed = textNodes.map((n) =>
      n.textContent?.trim()
    ) as string[];
    return mappedAndTrimmed.filter((t) => t.length > 0);
  }

  parseTherapistRow(t: HTMLTableRowElement) {
    const cells = t.querySelectorAll("td");
    const therapistCell = cells[0];
    const spaceCell = cells[1];

    const spaceAvailable = spaceCell.textContent as string;

    const therapistLink = therapistCell.querySelector("a") as HTMLAnchorElement;
    const href = therapistLink.getAttribute("href") as string;

    const fullName = therapistLink.textContent as string;
    const nameArray = fullName.split(/\s|&nbsp;/g);
    const lastName = nameArray[0];
    const firstName = nameArray[1];

    const extraInfoNode = Array.from(therapistCell.childNodes).find(
      (n) => n.nodeName === "#text"
    );

    let extraInfoTypes: string[] = [];

    if (extraInfoNode) {
      const trimmed = extraInfoNode.textContent
        ?.trim()
        .replace(/(\(|\))/gm, "") as string;
      extraInfoTypes = trimmed?.split(",").map((t) => t.trim());
    }

    return {
      firstName,
      lastName,
      href,
      extraInfoTypes,
      spaceAvailable,
    };
  }

  async parseTherapistTable(html: string, link: string) {
    const document = new JSDOM(html).window.document;
    const table = document.querySelector("table") as HTMLTableElement;
    const tableRows = table.querySelectorAll("tr");
    const therapistRows = Array.from(tableRows).slice(1);
    const therapists = therapistRows.map((t) => this.parseTherapistRow(t));
    const fullTherapists: any[] = [];

    for (let therapist of therapists) {
      const therapistHtml: string = (
        await axios.get(`https://pirha.fi${therapist.href}`)
      ).data;
      const therapistInfo = this.parseTherapist(therapistHtml);
      const fullTherapist = { ...therapist, ...therapistInfo };
      fullTherapists.push(fullTherapist);
      const type = link.split("/").pop();
      try {
        await mkdir(`./therapists/${type}`, { recursive: true });
      } catch (error) {}
      writeFile(
        `./therapists/${type}/${therapist.lastName}-${therapist.firstName}.json`,
        JSON.stringify(fullTherapist, null, 2)
      );
    }

    return fullTherapists;
  }
}

const parser = new PirhaParser();
parser.parseAllTherapists();