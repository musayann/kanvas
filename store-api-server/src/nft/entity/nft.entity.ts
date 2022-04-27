import { CategoryEntity } from 'src/category/entity/category.entity';

export interface NftEntity {
  id: number;
  createdAt: number;
  name: string;
  description: string;
  ipfsHash?: string;

  artifactUri: string;
  displayUri?: string;
  thumbnailUri?: string;

  price: string;
  categories: CategoryEntity[];
  editionsSize: number;
  editionsAvailable: number;
  launchAt: number;
  ownerStatuses?: string[];
}

export interface CreateNft {
  id: number;
  name: string;
  description: string;

  artifactUri: string;
  displayUri?: string;
  thumbnailUri?: string;

  price: number;
  categories: number[];
  editionsSize: number;
  launchAt: number;

  signature: string;
}

export interface NftEntityPage {
  firstRequestAt: number; // in UTC UNIX
  nfts: NftEntity[];
  currentPage: number;
  numberOfPages: number;
  lowerPriceBound: string;
  upperPriceBound: string;
}

export interface SearchResult {
  nfts: NftEntity[];
  categories: CategoryEntity[];
}
