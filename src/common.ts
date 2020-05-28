import { Headers } from "node-fetch";
import { HarborRequest, IVersion } from ".";

export const createFetchHeaders = <R extends HarborRequest>(request: R): Headers => {
  const headers = new Headers();
  if (request.source.basic_auth_username && request.source.basic_auth_password) {
    const basicAuthUsername = request.source.basic_auth_username;
    const basicAuthPassword = request.source.basic_auth_password;
    headers.append(
      "Authorization", `Basic ${new Buffer(basicAuthUsername + ":" + basicAuthPassword).toString("base64")}`);
  }
  return headers;
};

export const isCorrectArgumentLength = (argLen: number): void => {
  process.argv.forEach((element) => {
    process.stderr.write(`${element}\n`);
  });
  if (process.argv.length !== argLen) {
    process.stderr.write(`Expected exactly ${argLen} parameter(s), got ${process.argv.length - 2}.\n`);
    process.exit(102);
  }
};


export const isArrayEmpty = <T>(arr: T[] | undefined): boolean => arr ? arr.length === 0 ? true : false : false;


export const breakdownInputVersion = (version: string): IVersion => {
  const regex = /^([^\d]*)(\d+).?(\d+).?(\*|\d+)([^]*$)/gm;
  const groups = regex.exec(version);
  try {
    return groups != null ? {
        affix: groups[5] === null ? null : groups[5],
        major: parseInt(groups[2], 10),
        minor: parseInt(groups[3], 10),
        patch: parseInt(groups[4], 10),
        prefix: groups[1] === null ?  null : groups[1],
      } : { affix: "", major: 0, minor: 0, patch: 0, prefix: ""};
  } catch (err) {
    handleError(`Unable to find version in provided string. Please input a valid version.\n`);
    throw Error()
  }
};

export const createStringFromVersionObj = (vobj: IVersion): string => {
  const verArr = [vobj.major, vobj.minor, vobj.patch];
  const verStrArr: any[] = [];
  vobj.prefix !== null ? verStrArr.push(vobj.prefix) : null;
  verArr.forEach(
    (i, idx) => idx === (verArr.length - 1) ? verStrArr.push(`${i}`) : verStrArr.push(`${i}.`));
  vobj.affix !== null ? verStrArr.push(vobj.affix) : null;
  return verStrArr.join("");
};

export const handleError = (errMsg: string) => {
  process.stderr.write(errMsg);
  Error(errMsg);
  process.exit(1);
}