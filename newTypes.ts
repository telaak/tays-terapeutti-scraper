export type TherapyInfo = {
  languages: string[];
  targetGroups: string[];
  additionalInfo: string[];
};

export type ContactInfo = {
  extraInfo: string[];
  phoneNumber: string;
  email: string;
};

export type THerapist = {
  firstName: string;
  lastName: string;
  href: string;
  extraInfoTypes: string[];
  jobTitle: string;
  reception: string[];
  education: string[];
  spaceAvailable: string;
  therapyInfo: TherapyInfo;
};
