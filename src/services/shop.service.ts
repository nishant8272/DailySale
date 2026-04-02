import type { Shop } from "../types/auth.types";
import { fetchMyProfileApi } from "./user.service";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

type ApiError = Error & {
	status?: number;
};

const toApiError = (message: string, status?: number): ApiError => {
	const error = new Error(message) as ApiError;
	error.status = status;
	return error;
};

const getAuthHeader = () => {
	const token = localStorage.getItem("token");

	if (!token) {
		throw new Error("Missing auth token");
	}

	return {
		Authorization: `Bearer ${token}`,
	};
};

export const getCurrentShopApi = async (): Promise<Shop> => {
	const profile = await fetchMyProfileApi();
	return profile.shop;
};

export const updateMyShopApi = async (input: { name?: string; address?: string }): Promise<Shop> => {
	try {
		const response = await axios.patch(`${API_BASE_URL}/api/shops/me`, input, {
			headers: getAuthHeader(),
		});

		const payload = response.data as {
			message?: string;
			data?: Shop;
		};

		if (!payload.data) {
			throw new Error(payload.message || "Failed to update shop");
		}

		return payload.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			const status = error.response?.status;
			const message =
				(error.response?.data as { message?: string } | undefined)?.message ||
				"Failed to update shop";
			throw toApiError(message, status);
		}

		throw toApiError("Failed to update shop");
	}
};
