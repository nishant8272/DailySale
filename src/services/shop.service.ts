import type { Shop } from "../types/auth.types";
import { fetchMyProfileApi } from "./user.service";

export const getCurrentShopApi = async (): Promise<Shop> => {
	const profile = await fetchMyProfileApi();
	return profile.shop;
};
