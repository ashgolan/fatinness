import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Api } from "../api/Api";

export const useSystemSetupCheck = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await Api.get("/check-first-run");

        if (res.data.needsSetup) {
          navigate("/register-superadmin");
        }
      } catch (err) {
        console.error("❌ System Setup Check Error:", err);
      }

      setLoading(false);
    };

    check();
  }, [navigate]);

  return { loading };
};
