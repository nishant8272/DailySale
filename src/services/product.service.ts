import axios from "axios";

export const getAllProducts = async (token: string) => {
  const res = await axios.get("http://localhost:3000/api/products", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
