import { useDispatch, useSelector } from "react-redux";
import { fetchPeriod } from "../features/ppdb/periodSlice";

export const usePeriod = () => {
  const dispatch = useDispatch();
  const { allPeriods, periodDetails } = useSelector((state) => state.periods);

  const getSinglePeriod = async (periodKey) => {
    try {
      let period =
        allPeriods.find((p) => p.key === periodKey) ||
        periodDetails[periodKey]?.period;

      if (!period) {
        const result = await dispatch(fetchPeriod(periodKey)).unwrap();
        period = result?.period;
      }

      return period || null;
    } catch (error) {
      console.error("Error getting period:", error);
      return null;
    }
  };

  return { getSinglePeriod };
};
