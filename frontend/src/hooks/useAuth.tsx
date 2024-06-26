/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import { notifications } from "@mantine/notifications";
import { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../lib/axios.config";
import { deleteCookie, setCookie } from "../lib/utils";
import { Student } from "../types";

interface AuthContextType {
    user: Student | null;
    login: (email: string, password: string) => void;
    loggingIn: boolean;
    register: (student: Omit<Student, "id" | "createdAt" | "updatedAt"> & {
        password: string;
    }) => void;
    registering: boolean;
    logout: () => void;
    loggingOut: boolean;
    initialLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 *  A function to provide authentication context to the application
 * @param @type {React.ReactNode} children
 * @description A provider to provide authentication context to the application
 * @returns  @type {React.ReactNode}
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [loggingIn, setLoggingIn] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [user, setUser] = useState<Student | null>(null);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (user) {
            setInitialLoading(false);
            return;
        }
        const fetchUser = async () => {
            try {
                const { data } = await axios.get("/students/me");
                setUser(data.user);
            } catch (error) {
                setUser(null);
                if (location.pathname.includes("/dashboard")) {
                    navigate("/login");
                }
            } finally {
                setInitialLoading(false);
            }
        };
        fetchUser();
    }
        , [location.pathname, user]);

    /**
     * A function to  Login a student
     * @param email email of the student
     * @param password  password of the student
     */
    const login = async (email: string, password: string) => {
        setLoggingIn(true);
        try {
            const { data } = await axios.post("/students/login", {
                email,
                password,
            });
            setUser(data.student);
            setCookie("token", data.token, 7);
            notifications.show({
                title: "Success",
                message: "Logged in successfully",
                color: "green",
            });
            navigate("/dashboard");
        } catch (error) {
            notifications.show({
                title: "Error",
                message: "Invalid email or password",
                color: "red",
            });
        } finally {
            setLoggingIn(false);
        }
    };

    /**
     * A function to register a student
     * @param @type {Omit<Student, "id" | "createdAt" | "updatedAt"> & { password: string; }} student
     * @param student student details
     * @param student.password password of the student
     */
    const register = async (student: Omit<Student, "id" | "createdAt" | "updatedAt"> & {
        password: string;
    }) => {
        setRegistering(true);
        try {
            const { data } = await axios.post("/students/register", student);
            if (data.success) {
                notifications.show({
                    title: "Success",
                    message: "Account created successfully",
                    color: "green",
                });
                navigate("/login");
            } else {
                notifications.show({
                    message: "something went wrong",
                    color: "red"
                })
            }
        } catch (error: any) {
            notifications.show({
                title: "Error",
                message: error.response?.data?.message ?? "An error occured",
                color: "red",
            });
        } finally {
            setRegistering(false);
        }
    };


    /**
     * A function to logout a student
     */
    const logout = async () => {
        setLoggingOut(true);
        try {
            await axios.get("/students/logout");
            setUser(null);
            deleteCookie("token");
            notifications.show({
                title: "Success",
                message: "Logged out successfully",
                color: "green",
            });
            navigate("/login");
        } catch (error) {
            notifications.show({
                title: "Error",
                message: "An error occurred",
                color: "red",
            });
        } finally {
            setLoggingOut(false);
        }
    };
    return (
        <AuthContext.Provider value={{ user, login, loggingIn, register, registering, logout, loggingOut, initialLoading }}>
            {children}
        </AuthContext.Provider>
    );

}

export default function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}


