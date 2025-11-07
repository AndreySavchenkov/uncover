"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Controller, useForm, SubmitHandler, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";

import { CitySelect } from "@/components/ui/city-select";
import { MultiSelect } from "@/components/ui/multiselect";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient"; // используйте тот же клиент, что и на странице create

import { GENDER_OPTIONS, Genders, LANGUAGE_OPTIONS } from "@/types";
import { useProfile } from "@/hooks/useProfile";
import { PhotoUploader } from "@/components/ui/photo-uploader";

const ABOUT_MAX = 500;

const formSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Min 3 symbols")
    .nonempty("Username is required"),
  age: z
    .string()
    .nonempty("Age is required")
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val), { message: "Age must be a number" })
    .refine((val) => val >= 18, { message: "You must be at least 18" })
    .refine((val) => val <= 100, { message: "Really? 😅" })
    .transform((val) => String(val)),
  about: z.string().trim().max(ABOUT_MAX, `Up to ${ABOUT_MAX} characters`),
  gender: z.nativeEnum(Genders),
  city_id: z.preprocess(
    (v) => (v === "undefined" || v === "" || v == null ? null : v),
    z.string().uuid().nullable()
  ),
  languages: z.array(z.string()).min(1, "Select at least one language"),
  looking_for: z.array(z.string()).min(1, "Select who you're looking for"),
  instagram: z.string().trim().url("Must be a valid URL"),
  telegram: z
    .union([z.string().trim().url("Must be a valid URL"), z.literal("")])
    .optional(),
  whatsapp: z
    .union([z.string().trim().url("Must be a valid URL"), z.literal("")])
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditProfile() {
  const [isSaving, setIsSaving] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const initialRef = useRef<FormValues | null>(null);

  const router = useRouter();
  const { profile, loading } = useProfile();

  // Преобразуем профиль -> значения формы
  const toArray = (v: unknown): string[] =>
    Array.isArray(v)
      ? (v as string[])
      : typeof v === "string"
      ? v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const formValues = useMemo<FormValues | undefined>(() => {
    if (!profile) return undefined;
    return {
      username: profile.username ?? "",
      age: String(profile.age ?? "18"),
      about: profile.about ?? "",
      gender: (profile.gender as Genders) ?? (undefined as unknown as Genders),
      city_id: profile.city_id ?? null,
      languages: toArray(profile.languages),
      looking_for: toArray(profile.looking_for),
      instagram: profile.instagram ?? "", // added
      telegram: profile.telegram ?? "", // added
      whatsapp: profile.whatsapp ?? "", // added
    };
  }, [profile]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<FormValues>,
    mode: "onChange",
    defaultValues: {
      username: "",
      age: "18",
      about: "",
      gender: undefined as unknown as Genders,
      city_id: null,
      languages: [],
      looking_for: [],
      instagram: "", // added
      telegram: "", // added
      whatsapp: "", // added
    },
  });

  // Применяем данные профиля в форму
  useEffect(() => {
    if (formValues) {
      form.reset(formValues);
      initialRef.current = formValues; // сохраняем начальные значения для диффа
    }
  }, [formValues, form]);

  // Фото-превью из профиля (если новое фото не выбрано)
  useEffect(() => {
    if (profile && !photo) {
      setPhotoPreview(profile.photo_url ?? null);
    }
  }, [profile, photo]);

  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  // Загрузка фото в Supabase Storage и возврат публичной ссылки
  const uploadPhoto = async (ownerId: string): Promise<string | null> => {
    if (!photo) return null;
    const MAX_BYTES = 5 * 1024 * 1024;
    if (photo.size > MAX_BYTES) throw new Error("Photo is larger than 5MB");
    if (!photo.type.startsWith("image/"))
      throw new Error("Unsupported file type");
    const ext =
      photo.name?.split(".").pop()?.toLowerCase() ||
      (photo.type.includes("png") ? "png" : "jpg");
    const fileName = `${ownerId}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("profile_photos")
      .upload(fileName, photo, {
        cacheControl: "3600",
        upsert: true,
        contentType: photo.type,
      });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage
      .from("profile_photos")
      .getPublicUrl(fileName);
    return data.publicUrl ?? null;
  };

  const normJoin = (arr: string[]) =>
    [...arr]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(",");

  // Парсим ключ объекта из публичного URL Supabase Storage
  function getStoragePathFromPublicUrl(url: string): string | null {
    try {
      const u = new URL(url);
      const prefix = "/storage/v1/object/public/profile_photos/";
      const idx = u.pathname.indexOf(prefix);
      if (idx === -1) return null;
      const key = u.pathname.substring(idx + prefix.length);
      return decodeURIComponent(key);
    } catch {
      const prefix = "/storage/v1/object/public/profile_photos/";
      const i = url.indexOf(prefix);
      if (i === -1) return null;
      const tail = url.substring(i + prefix.length);
      return tail.split("?")[0];
    }
  }

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      setIsSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const profileId = (profile as { id?: string } | null | undefined)?.id;
      const targetId = profileId ?? user?.id ?? null;
      if (!targetId) throw new Error("Can't determine profile id");

      const oldPhotoUrl = profile?.photo_url ?? null;

      const initial = initialRef.current;
      const changes: Record<string, any> = {};
      const norm = (v?: string | null) => {
        const s = (v ?? "").trim();
        return s.length ? s : null;
      };

      if (initial) {
        if (values.username.trim() !== initial.username.trim())
          changes.username = values.username.trim();
        if (Number(values.age) !== Number(initial.age))
          changes.age = Number(values.age);
        if (values.about.trim() !== initial.about.trim())
          changes.about = values.about.trim();
        if (values.gender !== initial.gender) changes.gender = values.gender;
        if ((values.city_id ?? null) !== (initial.city_id ?? null))
          changes.city_id = values.city_id ?? null;

        const langsNow = normJoin(values.languages);
        const langsInit = normJoin(initial.languages);
        if (langsNow !== langsInit) changes.languages = langsNow;

        const lfNow = normJoin(values.looking_for);
        const lfInit = normJoin(initial.looking_for);
        if (lfNow !== lfInit) changes.looking_for = lfNow;

        // socials
        if (norm(values.instagram) !== norm(initial.instagram))
          changes.instagram = norm(values.instagram);
        if (norm(values.telegram) !== norm(initial.telegram))
          changes.telegram = norm(values.telegram);
        if (norm(values.whatsapp) !== norm(initial.whatsapp))
          changes.whatsapp = norm(values.whatsapp);
      } else {
        changes.username = values.username.trim();
        changes.age = Number(values.age);
        changes.about = values.about.trim();
        changes.gender = values.gender;
        changes.city_id = values.city_id ?? null;
        changes.languages = normJoin(values.languages);
        changes.looking_for = normJoin(values.looking_for);
        changes.instagram = norm(values.instagram);
        changes.telegram = norm(values.telegram);
        changes.whatsapp = norm(values.whatsapp);
      }

      // Фото загрузка (как было)
      if (photo) {
        try {
          const photoUrl = await uploadPhoto(targetId);
          if (!photoUrl) {
            toast.error("Photo upload failed");
            return;
          }
          changes.photo_url = `${photoUrl}?v=${Date.now()}`;
        } catch (e: any) {
          toast.error(e?.message ?? "Photo upload failed");
          return;
        }
      }

      if (Object.keys(changes).length === 0) {
        toast.info("No changes to save");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update(changes)
        .eq("id", targetId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // После успешного обновления удаляем старую фотографию из Storage
      if (photo && oldPhotoUrl) {
        const oldPath = getStoragePathFromPublicUrl(oldPhotoUrl);
        if (oldPath) {
          try {
            await supabase.storage.from("profile_photos").remove([oldPath]);
          } catch {
            // опционально можно показать предупреждение, но не валим успех
          }
        }
      }

      toast.success("Profile updated");
      router.push("/profile");
    } catch (e: any) {
      toast.error(e?.message ?? "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-10 mb-10 px-4 sm:px-6">
        <Card>
          <CardHeader>
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-1">
                <div className="aspect-square w-full rounded-xl bg-muted animate-pulse" />
              </div>
              <div className="md:col-span-2 grid gap-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-5 w-full bg-muted rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto mt-10 mb-10 px-4 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>No profile to edit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You don’t have a profile yet.
            </p>
          </CardContent>
          <CardFooter className="justify-end">
            <Button asChild>
              <Link href="/profile/create">Create profile</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 mb-10 px-4 sm:px-6">
      <Card className="w-full sm:max-w-[unset]">
        <CardHeader>
          <CardTitle>Edit your profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="form" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Фото */}
                <div className="md:col-span-1">
                  <PhotoUploader
                    id="form-photo"
                    label="Profile photo"
                    hint="PNG/JPG up to 5MB"
                    previewUrl={photoPreview}
                    onSelectFile={setPhoto}
                  />
                </div>

                {/* Поля */}
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

                  <Controller
                    name="age"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="form-age">Age</FieldLabel>
                        <Input
                          {...field}
                          id="form-age"
                          type="number"
                          min={18}
                          max={100}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

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
                          maxLength={ABOUT_MAX}
                          aria-describedby="about-counter"
                        />
                        <div
                          id="about-counter"
                          className="mt-1 text-xs text-muted-foreground text-right"
                        >
                          {field.value?.length ?? 0}/{ABOUT_MAX}
                        </div>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="city_id"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>City</FieldLabel>
                        <CitySelect
                          value={(field.value as string) ?? null}
                          onChange={(v) => field.onChange(v ?? null)}
                          placeholder="City, Country"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

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

                  {/* Social links */}
                  <Controller
                    name="instagram"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Instagram URL</FieldLabel>
                        <Input
                          {...field}
                          placeholder="https://instagram.com/yourname"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="telegram"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Telegram URL</FieldLabel>
                        <Input {...field} placeholder="https://t.me/yourname" />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="whatsapp"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>WhatsApp URL</FieldLabel>
                        <Input
                          {...field}
                          placeholder="https://wa.me/1234567890"
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
        <CardFooter className="justify-between">
          <Button asChild variant="outline">
            <Link href="/profile">Cancel</Link>
          </Button>
          <Button
            type="submit"
            form="form"
            disabled={isSaving || !form.formState.isValid}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
