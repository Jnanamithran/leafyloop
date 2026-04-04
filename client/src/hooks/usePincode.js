import { useState, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { resolveShipping, formatShippingSummary } from "../utils/pincodeLogic";
import { setShipping, clearShipping } from "../store/slices/cartSlice";

/**
 * usePincode
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook that manages pincode input state, validation,
 * API fetching, and Redux shipping dispatch.
 *
 * Usage:
 *   const { pincode, resolution, loading, error, handleChange, handleSubmit, reset } = usePincode();
 */
export function usePincode() {
  const dispatch = useDispatch();

  const [pincode,    setPincode]    = useState("");
  const [resolution, setResolution] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const abortRef = useRef(null);

  const handleChange = useCallback((e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(val);

    // Reset when user edits
    setResolution(null);
    setError(null);
    dispatch(clearShipping());
  }, [dispatch]);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();

    if (pincode.length !== 6) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    // Cancel previous in-flight request
    abortRef.current?.abort();

    setLoading(true);
    setError(null);
    setResolution(null);

    const toastId = toast.loading("Checking delivery availability…");

    const result = await resolveShipping(pincode);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      toast.error(result.error, { id: toastId });
      dispatch(clearShipping());
    } else {
      setResolution(result);
      dispatch(setShipping({
        pincode: result.pincode,
        city:    result.city,
        state:   result.state,
        cost:    result.cost,
        label:   result.label,
        key:     result.key,
      }));
      toast.success(formatShippingSummary(result), { id: toastId, duration: 4000 });
    }
  }, [pincode, dispatch]);

  const reset = useCallback(() => {
    setPincode("");
    setResolution(null);
    setError(null);
    dispatch(clearShipping());
  }, [dispatch]);

  return {
    pincode,
    resolution,
    loading,
    error,
    handleChange,
    handleSubmit,
    reset,
    isValid: resolution?.success === true,
  };
}
