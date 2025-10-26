"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import z from "zod";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multiselect";
import { CitySelect } from "@/components/ui/city-select";
import { GENDER_OPTIONS, Genders, LANGUAGE_OPTIONS } from "@/types";
import { ImagePlus } from "lucide-react";

const formSchema = z.object({
  username: z.string().trim().min(3, "Min 3 symbols"),
  age: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val), { message: "Age must be a number" })
    .refine((val) => val >= 18, { message: "You must be at least 18" })
    .refine((val) => val <= 100, { message: "Really? 😅" })
    .transform((val) => String(val)),
  about: z.string().trim(),
  gender: z.nativeEnum(Genders),
  city_id: z.string().uuid().nullable().optional(),
  languages: z.array(z.string()).min(1, "Select at least one language"),
  looking_for: z.array(z.string()).min(1, "Select who you're looking for"),
});

export default function CreateProfilePage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      age: "18",
      about: "",
      gender: undefined as unknown as Genders,
      city_id: null,
      languages: [],
      looking_for: [],
    },
  });

  async function onSubmit(formData: z.infer<typeof formSchema>) {
    try {
      if (user) {
        const photoUrl = await uploadPhoto();

        const { error } = await supabase.from("profiles").upsert({
          id: user.id,
          username: formData.username,
          age: formData.age,
          photo_url: photoUrl,
          gender: formData.gender,
          city_id: formData.city_id ?? null,
          languages: formData.languages.join(","), // хранение как строка
          looking_for: formData.looking_for.join(","), // хранение как строка
          about: formData.about,
          email: user.email,
        });

        if (error) {
          toast.error(`${error.message}`, {
            position: "top-center",
          });
        }

        if (!error) {
          toast.success("Success!", {
            position: "top-center",
          });
          router.push("/");
        }
      }
    } catch (error) {
      toast.error(`Error: ${error}`, {
        position: "top-center",
      });
    }
  }

  const { setPhoto, photoPreview, uploadPhoto } = usePhotoUpload(user!);

  useEffect(() => {
    if (!user && !userLoading) router.push("/login");
  }, [user, userLoading]);

  return (
    <div className="max-w-3xl mx-auto mt-10 mb-10 px-4 sm:px-6">
      <Card className="w-full sm:max-w-[unset]">
        <CardHeader>
          <CardTitle>Create your profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="form" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Фото / дропзона */}
                <div className="md:col-span-1">
                  <Field>
                    <FieldLabel htmlFor="form-photo">Profile photo</FieldLabel>
                    <input
                      id="form-photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                    />
                    <label
                      htmlFor="form-photo"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const f = e.dataTransfer.files?.[0];
                        if (f) setPhoto(f);
                      }}
                      className="relative mt-2 block aspect-square w-full overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/40 bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer"
                      aria-describedby="photo-hint"
                    >
                      {photoPreview ? (
                        <>
                          <img
                            src={photoPreview}
                            alt="Photo preview"
                            className="h-full w-full object-cover"
                          />
                          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-2 right-2 rounded-md bg-background/80 px-2 py-1 text-xs text-foreground shadow-sm backdrop-blur">
                            Change photo
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                          <ImagePlus className="h-8 w-8 opacity-70" />
                          <div className="text-sm font-medium">
                            Click or drop image
                          </div>
                          <div id="photo-hint" className="text-xs">
                            PNG/JPG up to 5MB
                          </div>
                        </div>
                      )}
                    </label>
                    {photoPreview && (
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document.getElementById("form-photo")?.click()
                          }
                          className="h-8"
                        >
                          Change
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setPhoto(null)}
                          className="h-8 text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </Field>
                </div>
                {/* Поля формы */}
                <div className="md:col-span-2 space-y-4">
                  <Controller
                    name="username"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="form-username">
                          Username
                        </FieldLabel>
                        <Input
                          {...field}
                          id="form-username"
                          placeholder="Enter your username"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  {/* age */}
                  <Controller
                    name="age"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="form-age">Age</FieldLabel>
                        <Input
                          {...field}
                          type="number"
                          id="form-age"
                          placeholder="Enter your age"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  {/* about */}
                  <Controller
                    name="about"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="form-about">About</FieldLabel>
                        <Textarea
                          {...field}
                          id="form-about"
                          placeholder="Tell about yourself"
                          className="min-h-28"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  {/* city (single, хранит city_id) */}
                  <Controller
                    name="city_id"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>City</FieldLabel>
                        <CitySelect
                          value={(field.value as string) ?? null}
                          onChange={field.onChange}
                          placeholder="City, Country"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  {/* gender (single select) */}
                  <Controller
                    name="gender"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Gender</FieldLabel>
                        <MultiSelect
                          multiple={false}
                          options={GENDER_OPTIONS}
                          value={(field.value as string) ?? null}
                          onChange={field.onChange}
                          placeholder="Your Gender"
                          enableSearch={false}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  {/* languages (multi select) */}
                  <Controller
                    name="languages"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Languages</FieldLabel>
                        <MultiSelect
                          multiple
                          options={LANGUAGE_OPTIONS}
                          value={(field.value as string[]) ?? []}
                          onChange={field.onChange}
                          placeholder="Select languages"
                          searchThreshold={4}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  {/* looking for (multi select) */}
                  <Controller
                    name="looking_for"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Looking for</FieldLabel>
                        <MultiSelect
                          multiple
                          options={GENDER_OPTIONS}
                          value={(field.value as string[]) ?? []}
                          onChange={field.onChange}
                          placeholder="Who are you looking for?"
                          enableSearch={false}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Field orientation="horizontal">
            <Button type="submit" form="form">
              Create
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </div>
  );
}
