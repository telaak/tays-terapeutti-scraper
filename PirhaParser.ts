import axios from "axios";
import jsdom from "jsdom";
import { writeFile, mkdir } from "fs/promises";
import { ContactInfo, Therapist, TherapyInfo } from "./newTypes";
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

export class PirhaParser {
  public therapists: Partial<Therapist>[] = [];

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

    let therapistJson: Partial<Therapist> = {};

    const ingress = therapist.querySelector(".ingress") as HTMLParagraphElement;

    if (ingress) {
      therapistJson.jobTitle = ingress.textContent as string;
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
      therapistJson = { ...therapistJson, ...contactInfo };
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
          .map((n) => n.textContent?.trim()) as string[];
        therapistJson.education = education;
      } else {
        const education = Array.from(educationList.querySelectorAll("li")).map(
          (n) => n.textContent?.trim()
        ) as string[];
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
      therapistJson = { ...therapistJson, ...therapyInfo };
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
        n.textContent?.includes("Psykoterapiakielet:")
      );
      if (languagesNodeIndex >= 0) {
        const languageNode = listElements
          .splice(languagesNodeIndex, 1)
          .pop() as HTMLLIElement;

        const languages = languageNode.textContent
          ?.replace("Psykoterapiakielet: ", "")
          .split(",")
          .map((t) => t.trim()) as string[];
        therapyInfo.languages = languages;
      }
    } catch (error) {
      console.error(error);
    }

    try {
      const targetGroupNodeIndex = listElements.findIndex(
        (n) =>
          n.textContent?.includes("Kohderyhmä:") ||
          n.textContent?.includes("Kohderyhmät:")
      );

      if (targetGroupNodeIndex >= 0) {
        const targetGroupNode = listElements
          .splice(targetGroupNodeIndex, 1)
          .pop() as HTMLLIElement;

        const targetGroups = targetGroupNode.textContent
          ?.replace("Kohderyhmät:", "")
          .replace("Kohderyhmä:", "")
          .split(",")
          .map((t) => t.trim()) as string[];

        therapyInfo.targetGroups = targetGroups;
      }
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
      if (phoneNumberNodeIndex >= 0) {
        const phoneNumberNode = listElements
          .splice(phoneNumberNodeIndex, 1)
          .pop() as HTMLLIElement;
        if (phoneNumberNode) {
          const phoneNumber = phoneNumberNode?.textContent?.replace(/\D/g, "");
          contactInfo.phoneNumber = phoneNumber;
        }
      }
    } catch (error) {
      console.error(error);
    }

    try {
      const emailNodeIndex = listElements.findIndex((n) =>
        n.textContent?.includes("Sähköposti")
      );
      if (emailNodeIndex >= 0) {
        const emailNode = listElements
          .splice(emailNodeIndex, 1)
          .pop() as HTMLLIElement;
        if (emailNode) {
          const email = emailNode?.textContent
            ?.replace(/Sähköposti/, "")
            .replace(/\s/g, "");
          contactInfo.email = email;
        }
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

    const parsedFullName = therapistLink.textContent as string;
    const nameArray = parsedFullName.split(/\s|&nbsp;/g);
    const lastName = nameArray[0];
    const firstName = nameArray[1];
    const fullName = `${firstName}${lastName}`;

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
      fullName,
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
    const fullTherapists: Partial<Therapist>[] = [];

    for (let therapist of therapists) {
      const therapistHtml: string = (
        await axios.get(`https://pirha.fi${therapist.href}`)
      ).data;
      const therapistInfo = this.parseTherapist(therapistHtml);
      const fullTherapist = { ...therapist, ...therapistInfo };
      fullTherapists.push(fullTherapist);
      const type = link.split("/").pop();

      if (process.env.API_URL) {
        try {
          axios.post(process.env.API_URL, therapist);
        } catch (error) {
          console.error(error);
        }
      }
    }

    return fullTherapists;
  }
}
