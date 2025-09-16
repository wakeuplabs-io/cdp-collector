import { PinataSDK } from "pinata";

export interface IpfsClient {
  uploadJSON(json: object): Promise<string>;
  downloadJSON(cid: string): Promise<object>;
}

export class PinataIpfs implements IpfsClient {
  private client: PinataSDK;

  constructor(pinataJwt: string, pinataGateway: string) {
    this.client = new PinataSDK({
      pinataJwt,
      pinataGateway,
    });
  }

  async uploadJSON(json: object): Promise<string> {
    const result = await this.client.upload.public.json(json);
    return result.cid;
  }

  async downloadJSON(cid: string): Promise<object> {
    const result = await this.client.gateways.public.get(cid);
    if (result.contentType !== "application/json") {
      throw new Error("Content type is not JSON");
    }

    return result.data as object;
  }
}
