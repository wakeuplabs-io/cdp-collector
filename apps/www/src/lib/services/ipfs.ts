import { PinataSDK } from "pinata";

export interface IpfsClient {
  uploadFile(file: File): Promise<string>;
  downloadFile(cid: string): Promise<Blob>;
  uploadJSON(json: object): Promise<string>;
  downloadJSON(cid: string): Promise<object>;
  buildGatewayUrl(cid: string): string;
}

export class PinataIpfs implements IpfsClient {
  private client: PinataSDK;

  constructor(
    private readonly pinataJwt: string,
    private readonly pinataGateway: string
  ) {
    this.client = new PinataSDK({
      pinataJwt: this.pinataJwt,
      pinataGateway: this.pinataGateway,
    });
  }

  async uploadFile(file: File): Promise<string> {
    const result = await this.client.upload.public.file(file);
    return result.cid;
  }

  async downloadFile(cid: string): Promise<Blob> {
    const result = await this.client.gateways.public.get(cid);
    return result.data as Blob;
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

  buildGatewayUrl(cid: string): string {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
}
