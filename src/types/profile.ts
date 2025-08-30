export default interface IProfile {
  _id?: string;
  name?: string;
  email?: string;
  image?: string;
  phoneNo?: string;
  dob?: Date;
  currency?: string;
  lang?: string;
  notifications?: boolean;
  twoFactorAuth?: boolean;
}
