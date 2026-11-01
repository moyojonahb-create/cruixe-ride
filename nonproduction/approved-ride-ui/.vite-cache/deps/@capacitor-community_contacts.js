import {
  registerPlugin
} from "./chunk-ZWH2WJAO.js";
import "./chunk-WOOG5QLI.js";

// ../../node_modules/@capacitor-community/contacts/dist/esm/definitions.js
var PhoneType;
(function(PhoneType2) {
  PhoneType2["Home"] = "home";
  PhoneType2["Work"] = "work";
  PhoneType2["Other"] = "other";
  PhoneType2["Custom"] = "custom";
  PhoneType2["Mobile"] = "mobile";
  PhoneType2["FaxWork"] = "fax_work";
  PhoneType2["FaxHome"] = "fax_home";
  PhoneType2["Pager"] = "pager";
  PhoneType2["Callback"] = "callback";
  PhoneType2["Car"] = "car";
  PhoneType2["CompanyMain"] = "company_main";
  PhoneType2["Isdn"] = "isdn";
  PhoneType2["Main"] = "main";
  PhoneType2["OtherFax"] = "other_fax";
  PhoneType2["Radio"] = "radio";
  PhoneType2["Telex"] = "telex";
  PhoneType2["TtyTdd"] = "tty_tdd";
  PhoneType2["WorkMobile"] = "work_mobile";
  PhoneType2["WorkPager"] = "work_pager";
  PhoneType2["Assistant"] = "assistant";
  PhoneType2["Mms"] = "mms";
})(PhoneType || (PhoneType = {}));
var EmailType;
(function(EmailType2) {
  EmailType2["Home"] = "home";
  EmailType2["Work"] = "work";
  EmailType2["Other"] = "other";
  EmailType2["Custom"] = "custom";
  EmailType2["Mobile"] = "mobile";
})(EmailType || (EmailType = {}));
var PostalAddressType;
(function(PostalAddressType2) {
  PostalAddressType2["Home"] = "home";
  PostalAddressType2["Work"] = "work";
  PostalAddressType2["Other"] = "other";
  PostalAddressType2["Custom"] = "custom";
})(PostalAddressType || (PostalAddressType = {}));

// ../../node_modules/@capacitor-community/contacts/dist/esm/index.js
var Contacts = registerPlugin("Contacts", {
  web: () => import("./web-3NI3ARGJ.js").then((m) => new m.ContactsWeb())
});
export {
  Contacts,
  EmailType,
  PhoneType,
  PostalAddressType
};
//# sourceMappingURL=@capacitor-community_contacts.js.map
