import React from "react";

const ImageCard = ({ src, alt, rotation }) => {
  return (
    <a href="#_">
      <img
        src={src}
        alt={alt}
        className={`rounded-xl ${rotation} hover:rotate-0 duration-500 hover:-translate-y-12 h-full w-full object-cover hover:scale-150 transform origin-bottom`}
      />
    </a>
  );
};

const TutorialCard = () => {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 sm:flex sm:justify-center sm:px-6 sm:pb-5 lg:px-8">
      <div className="pointer-events-auto flex w-full max-w-md divide-x divide-neutral-200 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
        <div className="flex w-0 flex-1 items-center p-4">
          <div className="w-full">
            <p className="text-sm font-medium text-neutral-900">Tutorial</p>
            <p className="mt-1 text-sm text-neutral-500">
              How to create animated image cards with Tailwind CSS and Astrojs
            </p>
            <p className="mt-2 text-xs text-orange-500 underline">
              <a
                href="https://lexingtonthemes.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                by © Lexington Themes
              </a>
            </p>
          </div>
        </div>
        <div className="flex">
          <div className="flex flex-col divide-y divide-neutral-200">
            <div className="flex h-0 flex-1">
              <a
                target="_blank"
                href="https://lexingtonthemes.com/tutorials/how-to-create-animated-images-with-tailwind-css-and-astro-js/"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-none rounded-tr-lg border border-transparent px-4 py-3 text-sm font-medium text-orange-600 hover:text-orange-500 focus:z-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Tutorial
              </a>
            </div>
            <div className="flex h-0 flex-1">
              <a
                target="_blank"
                href="https://github.com/UnwrappedDesign/lexington-tutorials/tree/main/src/pages/simplified-cards"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-none rounded-br-lg border border-transparent px-4 py-3 text-sm font-medium text-neutral-700 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Get the code
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GalleryCard = () => {
  return (
    <section className="bg-zinc-50 overflow-hidden">
      <div className="max-w-screen-xl 2xl:max-w-screen-3xl px-8 md:px-12 mx-auto py-12 lg:py-24 space-y-24 h-svh flex flex-col justify-center">
        {/* Image Gallery */}
        <div className="flex flex-col sm:flex-row mx-auto">
          <ImageCard
            src="https://images.unsplash.com/photo-1530035415911-95194de4ebcc?q=80&amp;w=2670&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Landscape view with a soft blur"
            rotation="rotate-6"
          />
          <ImageCard
            src="https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&amp;w=2672&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="A beautiful sunset over mountains"
            rotation="-rotate-12"
          />
          <ImageCard
            src="https://images.unsplash.com/photo-1586996292898-71f4036c4e07?q=80&amp;w=2670&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Abstract artwork with vibrant colors"
            rotation="rotate-6"
          />
          <ImageCard
            src="https://images.unsplash.com/photo-1522775417749-29284fb89f43?q=80&amp;w=2574&amp;auto=format&amp;fit=crop&amp;ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Ocean waves captured at dusk"
            rotation="-rotate-12"
          />
        </div>

        {/* Tutorial Section */}
        <TutorialCard />
      </div>
    </section>
  );
};
