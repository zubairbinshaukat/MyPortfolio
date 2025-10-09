import { cn } from "@/lib/utils"; // if you're using clsx or className helper

export const HelloCard = () => {
  const Icon = ({ className, ...rest }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width={24}
      height={24}
      strokeWidth="1"
      stroke="currentColor"
      {...rest}
      className={cn("dark:text-white text-black size-6 absolute", className)}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );

  return (
    <div className="border border-dashed border-zinc-400 dark:border-zinc-700 relative flex items-center justify-center px-4 py-3 w-fit">
      {/* Corner Icons */}
      <Icon className="-top-3 -left-3" />
      <Icon className="-top-3 -right-3" />
      <Icon className="-bottom-3 -left-3" />
      <Icon className="-bottom-3 -right-3" />

      {/* Centered Text */}
      <h1 className="text-3xl font-yatra font-bold text-gray-900 dark:text-gray-100">
        Hello!
      </h1>
    </div>
  );
};
