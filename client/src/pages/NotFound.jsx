import Error from "../assets/error.jpg";
export default function NotFound() {
  return (
    <section className="p-8">
      <h2 className="text-2xl text-error text-center">404 ERORR</h2>
      <p className="text-2xl text-error text-center mb-4">page not found</p>

      <img src={Error} alt="Error 404 Not found" className="w-full" />
    </section>
  );
}
