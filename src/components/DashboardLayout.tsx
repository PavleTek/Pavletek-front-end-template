import React, { useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
} from "@headlessui/react";
import {
  Bars3Icon,
  BellIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  HomeIcon,
  XMarkIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  allowedRoles?: string[];
}

const navigationItems: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  {
    name: "Users",
    href: "/users",
    icon: UserGroupIcon,
    allowedRoles: ["admin", "manager"],
  },
  {
    name: "Accounting",
    href: "/accounting",
    icon: ChartPieIcon,
    allowedRoles: ["admin", "manager", "accountant"],
  },
];

function hasRequiredRole(userRoles: string[], allowedRoles?: string[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true; // No role restriction, everyone can access
  }
  return allowedRoles.some((role) => userRoles.includes(role));
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Filter navigation items based on user roles
  const userRoles = user?.roles || [];
  const navigation = navigationItems.filter((item) => hasRequiredRole(userRoles, item.allowedRoles));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userNavigation = [
    { name: "Your profile", href: "#", onClick: () => {} },
    { name: "Sign out", href: "#", onClick: handleLogout },
  ];

  return (
    <>
      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
          >
            <TransitionChild>
              <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon aria-hidden={true} className="size-6 text-white" />
                </button>
              </div>
            </TransitionChild>

            {/* Sidebar component, swap this element with another sidebar if you like */}
            <div className="relative flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center my-2 -ml-9">
                <img alt="PavleTek" src="src\assets\Transparent_Image_1.png" className="max-w-[70%]" />
              </div>
              <nav className="relative flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <button
                            onClick={() => {
                              navigate(item.href);
                              setSidebarOpen(false);
                            }}
                            className={classNames(
                              location.pathname === item.href
                                ? "bg-gray-50 text-primary-800"
                                : "text-gray-700 hover:bg-gray-50 hover:text-primary-800",
                              "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold w-full text-left"
                            )}
                          >
                            <item.icon
                              aria-hidden={true}
                              className={classNames(
                                location.pathname === item.href
                                  ? "text-primary-800"
                                  : "text-gray-400 group-hover:text-primary-800",
                                "size-6 shrink-0"
                              )}
                            />
                            {item.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                  {hasRequiredRole(userRoles, ["admin"]) && (
                    <li className="mt-auto">
                      <button
                        onClick={() => {
                          navigate("/settings");
                          setSidebarOpen(false);
                        }}
                        className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-700 hover:bg-gray-50 hover:text-primary-800 w-full text-left"
                      >
                        <Cog6ToothIcon
                          aria-hidden={true}
                          className="size-6 shrink-0 text-gray-400 group-hover:text-primary-800"
                        />
                        Settings
                      </button>
                    </li>
                  )}
                </ul>
              </nav>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col dark">
        {/* Sidebar component, swap this element with another sidebar if you like */}
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center my-2 -ml-8">
                <img alt="PavleTek" src="src\assets\Transparent_Image_1.png" className="max-w-[72%]" />
              </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <button
                        onClick={() => navigate(item.href)}
                        className={classNames(
                          location.pathname === item.href
                            ? "bg-gray-50 text-primary-800"
                            : "text-gray-700 hover:bg-gray-50 hover:text-primary-800",
                          "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold w-full text-left"
                        )}
                      >
                        <item.icon
                          aria-hidden={true}
                          className={classNames(
                            location.pathname === item.href ? "text-primary-800" : "text-gray-400 group-hover:text-primary-800",
                            "size-6 shrink-0"
                          )}
                        />
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
              {hasRequiredRole(userRoles, ["admin"]) && (
                <li className="mt-auto">
                  <button
                    onClick={() => navigate("/settings")}
                    className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gFray-700 hover:bg-gray-50 hover:text-primary-800 w-full text-left"
                  >
                    <Cog6ToothIcon
                      aria-hidden={true}
                      className="size-6 shrink-0 text-gray-400 group-hover:text-primary-800"
                    />
                    Settings
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-xs sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 lg:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon aria-hidden={true} className="size-6" />
          </button>

          {/* Separator */}
          <div aria-hidden={true} className="h-6 w-px bg-gray-200 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="ml-auto flex items-center gap-x-4 lg:gap-x-6">
              <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                <span className="sr-only">View notifications</span>
                <BellIcon aria-hidden={true} className="size-6" />
              </button>

              {/* Separator */}
              <div aria-hidden={true} className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

              {/* Profile dropdown */}
              <Menu as="div" className="relative">
                <MenuButton className="relative flex items-center">
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">Open user menu</span>
                  <img
                    alt=""
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    className="size-8 rounded-full bg-gray-50 outline -outline-offset-1 outline-black/5"
                  />
                  <span className="hidden lg:flex lg:items-center">
                    <span aria-hidden={true} className="ml-4 text-sm/6 font-semibold text-gray-900">
                      {user?.name || "User"}
                    </span>
                    <ChevronDownIcon aria-hidden={true} className="ml-2 size-5 text-gray-400" />
                  </span>
                </MenuButton>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg outline-1 outline-gray-900/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                >
                  {userNavigation.map((item) => (
                    <MenuItem key={item.name}>
                      <button
                        onClick={item.onClick}
                        className="block w-full px-3 py-1 text-left text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                      >
                        {item.name}
                      </button>
                    </MenuItem>
                  ))}
                </MenuItems>
              </Menu>
            </div>
          </div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </>
  );
};

export default DashboardLayout;
