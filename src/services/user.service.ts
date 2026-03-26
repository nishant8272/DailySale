import axios from "axios";
import type { AuthUser, Shop } from "../types/auth.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export type MyProfileResponse = {
	user: AuthUser;
	shop: Shop;
};

export const fetchMyProfileApi = async (): Promise<MyProfileResponse> => {
	const token = localStorage.getItem("token");

	if (!token) {
		throw new Error("Missing auth token");
	}

	try {
		const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		const payload = response.data as {
			message?: string;
			data?: {
				user?: AuthUser;
				shop?: Shop;
			};
		};

		if (!payload.data?.user || !payload.data?.shop) {
			throw new Error(payload.message || "Failed to fetch profile");
		}

		return {
			user: payload.data.user,
			shop: payload.data.shop,
		};
	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response?.status === 401) {
				localStorage.removeItem("token");
				window.location.href = "/auth";
			}

			const message =
				(error.response?.data as { message?: string } | undefined)?.message ||
				"Failed to fetch profile";
			throw new Error(message);
		}

		throw new Error("Failed to fetch profile");
	}
};

export const getCurrentUserApi = async (): Promise<AuthUser> => {
	const profile = await fetchMyProfileApi();
	return profile.user;
};
