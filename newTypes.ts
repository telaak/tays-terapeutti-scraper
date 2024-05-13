export type TherapyInfo = {
  languages?: string[];
  targetGroups?: string[];
  additionalInfo?: string[];
};

export type ContactInfo = {
  extraInfo?: string[];
  phoneNumber?: string;
  email?: string;
};

export type Therapist = {
  firstName: string;
  lastName: string;
  fullName: string;
  href: string;
  extraInfoTypes?: string[];
  jobTitle?: string;
  reception?: string[];
  education?: string[];
  spaceAvailable?: string;
  homePage?: string;
} & TherapyInfo &
  ContactInfo;
