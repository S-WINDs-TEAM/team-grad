import { useEffect, useState } from "react";
import { getHistoryApi } from "../api/routeApi";

const TripHistoryPage = () => {
  const [trips, setTrips] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [page, setPage] = useState(1);

  const [limit] = useState(10);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    hasMore: false,
  });

  const fetchTrips = async () => {
    try {
      setLoading(true);

      const { data } = await getHistoryApi(page, limit);

      setTrips(data.trips);

      setPagination(data.pagination || data.data || {});

      setError("");
    } catch (err) {
      console.log(err);

      setError("Failed to load trip history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [page]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 mt-10">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6">

      <div className="flex justify-between items-center mb-6">

        <div>
          <h1 className="text-3xl font-bold">
            Trip History
          </h1>

          <p className="text-gray-500 mt-1">
            View all previously planned trips.
          </p>
        </div>

        <input
          type="text"
          placeholder="Search..."
          className="border rounded-lg px-4 py-2 outline-none"
        />

      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-100">

            <tr>

              <th className="px-4 py-3 text-left">
                Trip #
              </th>

              <th className="px-4 py-3 text-left">
                Vehicle
              </th>

              <th className="px-4 py-3 text-left">
                Origin
              </th>

              <th className="px-4 py-3 text-left">
                Destination
              </th>

              <th className="px-4 py-3 text-left">
                Distance
              </th>

              <th className="px-4 py-3 text-left">
                Duration
              </th>

              <th className="px-4 py-3 text-left">
                Risk
              </th>

              <th className="px-4 py-3 text-left">
                Status
              </th>

              <th className="px-4 py-3 text-left">
                Date
              </th>

            </tr>

          </thead>

          <tbody>

            {trips.length === 0 ? (

              <tr>

                <td
                  colSpan="9"
                  className="text-center py-8"
                >
                  No Trips Found
                </td>

              </tr>

            ) : (

              trips.map((trip) => (
                <tr
                  key={trip._id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    {trip.tripNumber}
                  </td>

                  <td className="px-4 py-3 capitalize">
                    {trip.vehicleType}
                  </td>

                  <td className="px-4 py-3">
                    {trip.origin?.address || "-"}
                  </td>

                  <td className="px-4 py-3">
                    {trip.destination?.address || "-"}
                  </td>

                  <td className="px-4 py-3">
                    {typeof trip.totalDistanceKm === "number" ? trip.totalDistanceKm.toFixed(1) : "-"} km
                  </td>

                  <td className="px-4 py-3">
                    {typeof trip.totalDurationMin === "number" ? trip.totalDurationMin : "-"} min
                  </td>

                  <td className="px-4 py-3">

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium
                      ${
                        trip.overallRiskLevel === "low"
                          ? "bg-green-100 text-green-700"
                          : trip.overallRiskLevel === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {trip.overallRiskLevel}
                    </span>

                  </td>

                  <td className="px-4 py-3 capitalize">
                    {trip.status}
                  </td>

                  <td className="px-4 py-3">
                    {new Date(trip.createdAt).toLocaleDateString()}
                  </td>

                </tr>
              ))

            )}

          </tbody>

        </table>

      </div>

      <div className="flex justify-center items-center gap-2 mt-6">

        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50"
        >
          Previous
        </button>

        {Array.from(
          { length: pagination.totalPages },
          (_, index) => (

            <button
              key={index}
              onClick={() => setPage(index + 1)}
              className={`px-4 py-2 rounded
                ${
                  page === index + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
            >
              {index + 1}
            </button>

          )
        )}

        <button
          onClick={() => setPage(page + 1)}
          disabled={page === pagination.totalPages || pagination.totalPages === 0}
          className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50"
        >
          Next
        </button>

      </div>

    </div>
  );
};

export default TripHistoryPage;