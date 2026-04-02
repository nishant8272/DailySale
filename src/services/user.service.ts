import axios from "axios";
import type { AuthUser, Shop } from "../types/auth.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export type MyProfileResponse = {
	user: AuthUser;
	shop: Shop;
};

export type CreateWorkerInput = {
	name: string;
	phone: string;
	password: string;
	email?: string;
};

export type UpdateUserInput = {
	name?: string;
	phone?: string;
	email?: string;
};

type ApiError = Error & {
	status?: number;
};

const toApiError = (message: string, status?: number): ApiError => {
	const error = new Error(message) as ApiError;
	error.status = status;
	return error;
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
			const status = error.response?.status;
			const message =
				(error.response?.data as { message?: string } | undefined)?.message ||
				"Failed to fetch profile";
			throw toApiError(message, status);
		}

		throw toApiError("Failed to fetch profile");
	}
};

export const getCurrentUserApi = async (): Promise<AuthUser> => {
	const profile = await fetchMyProfileApi();
	return profile.user;
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

export const fetchShopUsersApi = async (): Promise<AuthUser[]> => {
	try {
		const response = await axios.get(`${API_BASE_URL}/api/users`, {
			headers: getAuthHeader(),
		});

		const payload = response.data as {
			message?: string;
			data?: AuthUser[];
		};

		if (!Array.isArray(payload.data)) {
			throw new Error(payload.message || "Failed to fetch workers");
		}

		return payload.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			const status = error.response?.status;
			const message =
				(error.response?.data as { message?: string } | undefined)?.message ||
				"Failed to fetch workers";
			throw toApiError(message, status);
		}

		throw toApiError("Failed to fetch workers");
	}
};

export const createWorkerApi = async (input: CreateWorkerInput): Promise<AuthUser> => {
	try {
		const response = await axios.post(`${API_BASE_URL}/api/users`, input, {
			headers: getAuthHeader(),
		});

		const payload = response.data as {
			message?: string;
			data?: AuthUser;
		};

		if (!payload.data) {
			throw new Error(payload.message || "Failed to create worker");
		}

		return payload.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			const status = error.response?.status;
			const message =
				(error.response?.data as { message?: string } | undefined)?.message ||
				"Failed to create worker";
			throw toApiError(message, status);
		}

		throw toApiError("Failed to create worker");
	}
};

export const updateMyProfileApi = async (input: UpdateUserInput): Promise<AuthUser> => {
	try {
		const response = await axios.patch(`${API_BASE_URL}/api/users/me`, input, {
			headers: getAuthHeader(),
		});

		const payload = response.data as {
			message?: string;
			data?: AuthUser;
		};

		if (!payload.data) {
			throw new Error(payload.message || "Failed to update profile");
		}

		return payload.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			const status = error.response?.status;
			const message =
				(error.response?.data as { message?: string } | undefined)?.message ||
				"Failed to update profile";
			throw toApiError(message, status);
		}

		throw toApiError("Failed to update profile");
	}
};

export const updateUserByIdApi = async (
	userId: string,
	input: UpdateUserInput
): Promise<AuthUser> => {
	try {
		const response = await axios.patch(`${API_BASE_URL}/api/users/${userId}`, input, {
			headers: getAuthHeader(),
		});

		const payload = response.data as {
			message?: string;
			data?: AuthUser;
		};

		if (!payload.data) {
			throw new Error(payload.message || "Failed to update worker");
		}

		return payload.data;
	} catch (error) {
		if (axios.isAxiosError(error)) {
			const status = error.response?.status;
			const message =
				(error.response?.data as { message?: string } | undefined)?.message ||
				"Failed to update worker";
			throw toApiError(message, status);
		}

		throw toApiError("Failed to update worker");
	}
};
